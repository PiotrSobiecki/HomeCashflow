import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { jwtVerify, SignJWT } from "jose";
import { neon } from "@neondatabase/serverless";
import {
  decodeFinanceDataKey,
  encryptField,
  decryptField,
} from "./finance-crypto.js";
import {
  getTuyaToken,
  getDeviceInfo,
  getDeviceFunctions,
  getDeviceStatus,
  listProjectDevices,
  formatStatuses,
  sendCommands,
  getAcStatus,
  sendAcCommand,
  formatAcStatus,
  getRemoteKeys,
  sendRemoteKey,
} from "./tuya/client.js";
import { validateCommands, validateAcCommands } from "./tuya/commands.js";
import {
  buildAuthorizeUrl,
  exchangeCodeForTokens,
} from "./smartthings/oauth.js";
import { saveTokens, getFreshAccessToken } from "./smartthings/credentials.js";
import {
  getStDevices,
  getStDevice,
  getStDeviceStatus,
  sendStCommand,
} from "./smartthings/client.js";
import { summarizeDevices, inferDeviceType } from "./smartthings/devices.js";
import { mapStStatus } from "./smartthings/status.js";
import {
  buildStCommand,
  allowedStActions,
  buildStSettingCommand,
  allowedStSetting,
} from "./smartthings/commands.js";
import {
  readFinanceFromRelational,
  writeFinanceToRelational,
} from "./finance-relational.js";
import { logAction } from "./action-log.js";
import { geocodeCity, getOutdoorWeather } from "./weather.js";
import { thermostatThresholdGap } from "./ac-thermostat.js";
import { notifyHouseholdAcPower, pushConfigured } from "./push.js";
import {
  IR_PLUG_STANDBY_W,
  acPowerOnFromPlugW,
  readPlugPowerW,
  reconcileAcPower,
} from "./ir-plug-power.js";

// Snapshoty kolumn dla action_log — zachowujemy ciphertext bez deszyfrowania.
// Pozwala undo zapisać te same bajty z powrotem do tabel docelowych.
function snapshotTransaction(row) {
  return {
    id: row.id,
    kind: row.kind,
    name: row.name,
    amount: row.amount,
    txn_date: row.txn_date,
    year: row.year,
    month: row.month,
    is_fixed: row.is_fixed,
    category: row.category,
    created_by: row.created_by ?? null,
  };
}

function snapshotSavingsAccount(row) {
  return {
    id: row.id,
    name: row.name,
    amount: row.amount,
    icon: row.icon ?? null,
    created_by: row.created_by ?? null,
  };
}

function snapshotCategoryBudget(row) {
  return {
    id: row.id,
    name: row.name,
    monthly_limit: row.monthly_limit,
    created_by: row.created_by ?? null,
  };
}

// Reguła uprawnień do mutacji per-row (PATCH/DELETE):
//   - owner gospodarstwa → wszystko
//   - autor wpisu → swoje
//   - created_by IS NULL (wpisy sprzed feature'a) → każdy member, „trudno”
// Zwraca null gdy ok, albo { status, body } do oddania jako 403.
function assertCanMutateResource({ isOwner, createdBy, userId }) {
  if (isOwner) return null;
  if (createdBy == null) return null;
  if (createdBy === userId) return null;
  return { status: 403, body: { error: "forbidden_not_owner_of_entry" } };
}

function snapshotSavingsGoal(row) {
  return {
    type: row.type,
    monthly_amount: row.monthly_amount,
    yearly_amount: row.yearly_amount,
    target_month: row.target_month,
  };
}

// Okno czasowe dla undo — 24h od momentu akcji. Po tym czasie wpis zostaje
// w action_log do audytu, ale nie da sie juz go cofnac.
const UNDO_WINDOW_MS = 24 * 60 * 60 * 1000;

// Wrapper: log + nie przerywaj endpointu gdyby coś wybuchło w logu.
// (action_log to audit/undo, nie source of truth — błąd nie powinien zwalić mutacji)
async function safeLogAction(sql, payload) {
  try {
    await logAction(sql, payload);
  } catch (err) {
    console.error("[action-log] insert failed", err);
  }
}

export const app = new Hono();

app.onError((err, c) => {
  console.error("[hono onError]", err);
  if (err instanceof HTTPException) {
    return err.getResponse();
  }
  const msg = err instanceof Error ? err.message : String(err);
  return c.json({ error: "Server error", detail: msg }, 500);
});

// Env: Workers — c.env.[key] (sekrety + vars); lokalnie process.env. Bez samego `in` (Edge czasem inaczej enumeruje bindings).
function getEnv(c, key) {
  let v = c?.env?.[key];
  if (typeof v === "string") v = v.trim();
  if (v !== undefined && v !== null && v !== "") return v;
  let p = process.env[key];
  if (typeof p === "string") p = p.trim();
  if (p !== undefined && p !== null && p !== "") return p;
  return undefined;
}

/** Krótki kod do ?auth_err= na froncie (bez pełnej treści błędu w URL). */
function authFailureCode(message) {
  const m = String(message || "");
  if (m.includes("redirect_uri must be exactly")) return "oauth_redirect";
  if (m.includes("Google token exchange failed")) return "google_token";
  if (m.includes("DATABASE_URL")) return "config_db";
  if (m.includes("GOOGLE_CLIENT")) return "config_oauth";
  if (m.includes("Google profile missing")) return "profile";
  if (m.includes("Google userinfo failed")) return "google_profile";
  return "unknown";
}

app.use(
  "/api/*",
  cors({
    origin: (origin, c) => {
      const allowed = getEnv(c, "FRONTEND_URL") || "http://localhost:5173";
      return origin === allowed ? origin : null;
    },
    credentials: true,
  }),
);

function getSecret(c) {
  return new TextEncoder().encode(
    getEnv(c, "NEXTAUTH_SECRET") || "test-secret",
  );
}

function getDb(c) {
  const url = getEnv(c, "DATABASE_URL")?.trim();
  if (!url || !/^postgres(ql)?:\/\//i.test(url)) {
    throw new Error(
      "DATABASE_URL is missing or invalid (expected postgresql://…)",
    );
  }
  return neon(url);
}

/** Bazowy URL API bez końcowego slasha — musi się zgadzać z redirect URI w Google Cloud. */
function getApiBaseUrl(c) {
  const raw = getEnv(c, "NEXTAUTH_URL") || "http://localhost:3000";
  return String(raw).replace(/\/+$/, "");
}

function getFinanceDataKey(c) {
  return decodeFinanceDataKey(getEnv(c, "FINANCE_DATA_KEY"));
}

function parseCookie(header, name) {
  if (!header) return null;
  const match = header.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? match[1] : null;
}

export async function upsertUserAndHousehold(sql, profile) {
  // Upsert user
  const [user] = await sql`
    INSERT INTO users (google_id, email, name, avatar_url)
    VALUES (${profile.sub}, ${profile.email}, ${profile.name}, ${profile.picture || null})
    ON CONFLICT (google_id) DO UPDATE SET
      email = EXCLUDED.email,
      name = EXCLUDED.name,
      avatar_url = EXCLUDED.avatar_url
    RETURNING *
  `;

  // Check if user already has a household (as owner or member)
  const [existing] = await sql`
    SELECT household_id FROM household_members WHERE user_id = ${user.id}
  `;

  if (!existing) {
    // Create household + membership + finance_data
    const [household] = await sql`
      INSERT INTO households (owner_id) VALUES (${user.id}) RETURNING *
    `;
    await sql`
      INSERT INTO household_members (household_id, user_id) VALUES (${household.id}, ${user.id})
    `;
    await sql`
      INSERT INTO finance_data (household_id) VALUES (${household.id})
    `;
  }

  return user;
}

async function exchangeCodeForProfile(c, code) {
  const redirectUri = `${getApiBaseUrl(c)}/api/auth/callback`;
  const clientId = getEnv(c, "GOOGLE_CLIENT_ID");
  const clientSecret = getEnv(c, "GOOGLE_CLIENT_SECRET");
  if (!clientId || !clientSecret) {
    throw new Error(
      "GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is not configured",
    );
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  const tokenBody = await tokenRes.text();
  let tokens;
  try {
    tokens = JSON.parse(tokenBody);
  } catch {
    throw new Error(
      `Google token response was not JSON: ${tokenBody.slice(0, 200)}`,
    );
  }
  if (!tokenRes.ok || tokens.error) {
    const hint =
      tokens.error_description || tokens.error || tokenRes.statusText;
    throw new Error(
      `Google token exchange failed: ${hint} (redirect_uri must be exactly: ${redirectUri})`,
    );
  }
  if (!tokens.access_token) {
    throw new Error("Google token response had no access_token");
  }

  const profileRes = await fetch(
    "https://www.googleapis.com/oauth2/v3/userinfo",
    {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    },
  );
  const profile = await profileRes.json();
  if (!profileRes.ok || profile.error) {
    throw new Error(
      `Google userinfo failed: ${profile.error || profileRes.statusText}`,
    );
  }
  if (!profile.sub || !profile.email) {
    throw new Error("Google profile missing sub or email");
  }
  return profile;
}

app.get("/api/auth/google", (c) => {
  const clientId = getEnv(c, "GOOGLE_CLIENT_ID");
  const redirectUri = `${getApiBaseUrl(c)}/api/auth/callback`;
  const scope = "openid email profile";

  // Przekaż invite token przez OAuth state parameter
  const inviteToken = c.req.query("invite");

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", scope);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  if (inviteToken) {
    url.searchParams.set("state", inviteToken);
  }

  return c.redirect(url.toString());
});

app.get("/api/auth/callback", async (c) => {
  const oauthErr = c.req.query("error");
  if (oauthErr) {
    return c.json(
      {
        error: "OAuth error",
        detail: c.req.query("error_description") || oauthErr,
      },
      400,
    );
  }

  const code = c.req.query("code");
  if (!code) {
    return c.json({ error: "Missing code" }, 400);
  }

  try {
    const profile = await exchangeCodeForProfile(c, code);
    const sql = getDb(c);
    const user = await upsertUserAndHousehold(sql, profile);

    const token = await new SignJWT({ userId: String(user.id) })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(getSecret(c));

    const frontendUrl = String(
      getEnv(c, "FRONTEND_URL") || "http://localhost:5173",
    ).replace(/\/+$/, "");
    const inviteState = c.req.query("state");
    const redirectUrl = inviteState
      ? `${frontendUrl}?invite=${inviteState}`
      : frontendUrl;
    const cookieParts = [
      `token=${token}`,
      "HttpOnly",
      "Path=/",
      `Max-Age=${7 * 24 * 60 * 60}`,
      "SameSite=Lax",
    ];
    if (getApiBaseUrl(c).startsWith("https://")) {
      cookieParts.push("Secure");
    }
    return new Response(null, {
      status: 302,
      headers: {
        Location: redirectUrl,
        "Set-Cookie": cookieParts.join("; "),
      },
    });
  } catch (err) {
    console.error("[auth/callback]", err);
    const message = err instanceof Error ? err.message : String(err);
    const code = authFailureCode(message);
    const frontendUrl = String(
      getEnv(c, "FRONTEND_URL") || "http://localhost:5173",
    ).replace(/\/+$/, "");
    const accept = c.req.header("Accept") || "";
    // Przekierowanie z Google to nawigacja HTML — zwykle nie chcemy pokazywać surowego JSON.
    if (accept.includes("text/html")) {
      const u = new URL(frontendUrl);
      u.searchParams.set("auth_err", code);
      const inviteState = c.req.query("state");
      if (inviteState) u.searchParams.set("invite", inviteState);
      return c.redirect(u.toString(), 302);
    }
    return c.json({ error: "Auth failed", detail: message, code }, 500);
  }
});

app.post("/api/auth/logout", (c) => {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": "token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax",
    },
  });
});

// Auth middleware - extracts user from JWT, sets c.user
async function authMiddleware(c, next) {
  const token = parseCookie(c.req.header("cookie"), "token");
  if (!token) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const { payload } = await jwtVerify(token, getSecret(c));
    const sql = getDb(c);
    const [user] = await sql`
      SELECT id, email, name, avatar_url FROM users WHERE id = ${payload.userId}
    `;
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    c.set("user", user);
    await next();
  } catch (err) {
    console.error("[authMiddleware]", err);
    return c.json({ error: "Unauthorized" }, 401);
  }
}

app.get("/api/auth/me", authMiddleware, (c) => {
  return c.json({ user: c.get("user") });
});

// ============ FINANCE ENDPOINTS ============

app.get("/api/finance", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);

  const [membership] = await sql`
    SELECT household_id FROM household_members WHERE user_id = ${user.id}
  `;
  if (!membership) {
    return c.json({ data: {} });
  }

  const rawKey = getFinanceDataKey(c);
  if (!rawKey) {
    return c.json(
      { error: "Server misconfiguration: FINANCE_DATA_KEY missing" },
      500,
    );
  }

  try {
    const data = await readFinanceFromRelational(
      sql,
      membership.household_id,
      rawKey,
    );
    return c.json({ data });
  } catch (err) {
    console.error("GET /api/finance read error:", err);
    return c.json({ error: "Failed to load finance data" }, 500);
  }
});

app.put("/api/finance", authMiddleware, async (c) => {
  const user = c.get("user");
  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }
  if (
    !body ||
    typeof body.data !== "object" ||
    body.data === null ||
    Array.isArray(body.data)
  ) {
    return c.json({ error: 'Field "data" must be a JSON object' }, 400);
  }

  const sql = getDb(c);

  const [membership] = await sql`
    SELECT household_id FROM household_members WHERE user_id = ${user.id}
  `;
  if (!membership) {
    return c.json({ error: "No household" }, 400);
  }

  const rawKey = getFinanceDataKey(c);
  if (!rawKey) {
    return c.json(
      { error: "Server misconfiguration: FINANCE_DATA_KEY missing" },
      500,
    );
  }

  try {
    // Po Phase 3 wszystkie zasoby zarządzane per-row — PUT zostaje
    // tylko do replacowania activity_log (do czasu Phase 4 → action_log).
    await writeFinanceToRelational(
      sql,
      membership.household_id,
      body.data,
      rawKey,
      { onlyActivity: true },
    );
  } catch (err) {
    console.error("PUT /api/finance write error:", err);
    return c.json({ error: "Failed to save finance data" }, 500);
  }
  return c.json({ ok: true });
});

// ============ TRANSACTIONS (per-row) ============

/**
 * Ładuje transakcję jeśli user ma do niej dostęp, zwraca błąd-response gdy:
 * - rekord nie istnieje (404)
 * - rekord w innym household (403)
 * - If-Match nie matchuje aktualnego updated_at (409)
 * Returns { ok: true, row, updatedAtIso } albo { error: { status, body } }.
 */
async function loadTransactionForMutation(sql, userId, id, ifMatch, rawKey) {
  const [row] = await sql`
    SELECT t.*, h.owner_id AS household_owner_id
    FROM transactions t
    JOIN household_members hm ON hm.household_id = t.household_id
    JOIN households h ON h.id = t.household_id
    WHERE t.id = ${id} AND hm.user_id = ${userId}
  `;
  if (!row) {
    const [exists] = await sql`SELECT 1 FROM transactions WHERE id = ${id}`;
    return {
      error: {
        status: exists ? 403 : 404,
        body: { error: exists ? "forbidden" : "not found" },
      },
    };
  }

  const updatedAtIso =
    row.updated_at instanceof Date
      ? row.updated_at.toISOString()
      : String(row.updated_at);

  if (updatedAtIso !== ifMatch) {
    return {
      error: {
        status: 409,
        body: {
          error: "conflict",
          current: {
            id: row.id,
            kind: row.kind,
            name: await decryptField(row.name, rawKey),
            amount: Number(await decryptField(row.amount, rawKey)),
            txnDate: row.txn_date,
            year: row.year,
            month: row.month,
            isFixed: row.is_fixed,
            category: row.category,
            updatedAt: updatedAtIso,
          },
        },
      },
    };
  }

  return { ok: true, row, updatedAtIso };
}

function validateTransactionInput(body) {
  if (!body || typeof body !== "object") return "Body must be a JSON object";
  if (body.kind !== "income" && body.kind !== "expense")
    return "kind must be 'income' or 'expense'";
  if (typeof body.name !== "string" || !body.name.trim())
    return "name is required";
  if (typeof body.amount !== "number" || !Number.isFinite(body.amount))
    return "amount must be a finite number";
  if (
    typeof body.txnDate !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(body.txnDate)
  )
    return "txnDate must be YYYY-MM-DD";
  if (!Number.isInteger(body.year)) return "year must be an integer";
  if (!Number.isInteger(body.month) || body.month < 0 || body.month > 11)
    return "month must be 0-11";
  if (typeof body.isFixed !== "boolean") return "isFixed must be a boolean";
  return null;
}

app.post("/api/transactions", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);

  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }
  const validationError = validateTransactionInput(body);
  if (validationError) return c.json({ error: validationError }, 400);

  const [membership] = await sql`
    SELECT household_id FROM household_members WHERE user_id = ${user.id}
  `;
  if (!membership) return c.json({ error: "No household" }, 400);

  const rawKey = getFinanceDataKey(c);
  const nameEnc = await encryptField(body.name, rawKey);
  const amountEnc = await encryptField(body.amount, rawKey);

  const [row] = await sql`
    INSERT INTO transactions
      (household_id, kind, name, amount, txn_date, year, month, is_fixed, category, created_by)
    VALUES
      (${membership.household_id}, ${body.kind}, ${nameEnc}, ${amountEnc},
       ${body.txnDate}, ${body.year}, ${body.month}, ${body.isFixed},
       ${body.category ?? null}, ${user.id})
    RETURNING id, updated_at
  `;

  await safeLogAction(sql, {
    householdId: membership.household_id,
    actorId: user.id,
    operation: "CREATE",
    resourceType: "transaction",
    resourceId: row.id,
    before: null,
    after: snapshotTransaction({
      id: row.id,
      kind: body.kind,
      name: nameEnc,
      amount: amountEnc,
      txn_date: body.txnDate,
      year: body.year,
      month: body.month,
      is_fixed: body.isFixed,
      category: body.category ?? null,
      created_by: user.id,
    }),
  });

  return c.json(
    {
      id: row.id,
      kind: body.kind,
      name: body.name,
      amount: body.amount,
      txnDate: body.txnDate,
      year: body.year,
      month: body.month,
      isFixed: body.isFixed,
      category: body.category ?? null,
      createdBy: user.id,
      updatedAt: row.updated_at,
    },
    201,
  );
});

app.patch("/api/transactions/:id", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);
  const id = c.req.param("id");
  const ifMatch = c.req.header("if-match");
  if (!ifMatch) {
    return c.json({ error: "If-Match header is required" }, 400);
  }
  const body = await c.req.json();
  const rawKey = getFinanceDataKey(c);

  const result = await loadTransactionForMutation(
    sql,
    user.id,
    id,
    ifMatch,
    rawKey,
  );
  if (result.error) return c.json(result.error.body, result.error.status);
  const { row } = result;
  const permErr = assertCanMutateResource({
    isOwner: row.household_owner_id === user.id,
    createdBy: row.created_by,
    userId: user.id,
  });
  if (permErr) return c.json(permErr.body, permErr.status);

  const nextName = body.name !== undefined ? body.name : null;
  const nextAmount = body.amount !== undefined ? body.amount : null;
  const nextTxnDate = body.txnDate !== undefined ? body.txnDate : null;
  if (
    nextTxnDate !== null &&
    (typeof nextTxnDate !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(nextTxnDate))
  ) {
    return c.json({ error: "txnDate must be YYYY-MM-DD" }, 400);
  }
  const nameEnc =
    nextName !== null ? await encryptField(nextName, rawKey) : row.name;
  const amountEnc =
    nextAmount !== null ? await encryptField(nextAmount, rawKey) : row.amount;
  const txnDateVal = nextTxnDate !== null ? nextTxnDate : row.txn_date;

  const [updated] = await sql`
    UPDATE transactions
    SET name = ${nameEnc},
        amount = ${amountEnc},
        txn_date = ${txnDateVal},
        updated_at = NOW()
    WHERE id = ${id}
    RETURNING id, kind, txn_date, year, month, is_fixed, category, updated_at
  `;

  await safeLogAction(sql, {
    householdId: row.household_id,
    actorId: user.id,
    operation: "UPDATE",
    resourceType: "transaction",
    resourceId: id,
    before: snapshotTransaction(row),
    after: snapshotTransaction({
      ...row,
      name: nameEnc,
      amount: amountEnc,
      txn_date: txnDateVal,
    }),
  });

  return c.json({
    id: updated.id,
    kind: updated.kind,
    name: nextName ?? (await decryptField(row.name, rawKey)),
    amount: nextAmount ?? Number(await decryptField(row.amount, rawKey)),
    txnDate: updated.txn_date,
    year: updated.year,
    month: updated.month,
    isFixed: updated.is_fixed,
    category: updated.category,
    createdBy: row.created_by ?? null,
    updatedAt: updated.updated_at,
  });
});

app.delete("/api/transactions/:id", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);
  const id = c.req.param("id");
  const ifMatch = c.req.header("if-match");
  if (!ifMatch) {
    return c.json({ error: "If-Match header is required" }, 400);
  }
  const rawKey = getFinanceDataKey(c);

  const result = await loadTransactionForMutation(
    sql,
    user.id,
    id,
    ifMatch,
    rawKey,
  );
  if (result.error) return c.json(result.error.body, result.error.status);
  const permErr = assertCanMutateResource({
    isOwner: result.row.household_owner_id === user.id,
    createdBy: result.row.created_by,
    userId: user.id,
  });
  if (permErr) return c.json(permErr.body, permErr.status);

  await sql`DELETE FROM transactions WHERE id = ${id}`;

  await safeLogAction(sql, {
    householdId: result.row.household_id,
    actorId: user.id,
    operation: "DELETE",
    resourceType: "transaction",
    resourceId: id,
    before: snapshotTransaction(result.row),
    after: null,
  });

  return c.body(null, 204);
});

// ============ SAVINGS ACCOUNTS (per-row) ============

function validateSavingsAccountInput(body) {
  if (!body || typeof body !== "object") return "Body must be a JSON object";
  if (typeof body.name !== "string" || !body.name.trim())
    return "name is required";
  if (typeof body.amount !== "number" || !Number.isFinite(body.amount))
    return "amount must be a finite number";
  return null;
}

async function loadSavingsAccountForMutation(sql, userId, id, ifMatch, rawKey) {
  const [row] = await sql`
    SELECT s.*, h.owner_id AS household_owner_id
    FROM savings_accounts s
    JOIN household_members hm ON hm.household_id = s.household_id
    JOIN households h ON h.id = s.household_id
    WHERE s.id = ${id} AND hm.user_id = ${userId}
  `;
  if (!row) {
    const [exists] = await sql`SELECT 1 FROM savings_accounts WHERE id = ${id}`;
    return {
      error: {
        status: exists ? 403 : 404,
        body: { error: exists ? "forbidden" : "not found" },
      },
    };
  }
  const updatedAtIso =
    row.updated_at instanceof Date
      ? row.updated_at.toISOString()
      : String(row.updated_at);
  if (updatedAtIso !== ifMatch) {
    return {
      error: {
        status: 409,
        body: {
          error: "conflict",
          current: {
            id: row.id,
            name: await decryptField(row.name, rawKey),
            amount: Number(await decryptField(row.amount, rawKey)),
            icon: row.icon,
            updatedAt: updatedAtIso,
          },
        },
      },
    };
  }
  return { ok: true, row, updatedAtIso };
}

app.post("/api/savings-accounts", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);

  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }
  const validationError = validateSavingsAccountInput(body);
  if (validationError) return c.json({ error: validationError }, 400);

  const [membership] = await sql`
    SELECT household_id FROM household_members WHERE user_id = ${user.id}
  `;
  if (!membership) return c.json({ error: "No household" }, 400);

  const rawKey = getFinanceDataKey(c);
  const nameEnc = await encryptField(body.name, rawKey);
  const amountEnc = await encryptField(body.amount, rawKey);

  const [row] = await sql`
    INSERT INTO savings_accounts (household_id, name, amount, icon, created_by)
    VALUES (${membership.household_id}, ${nameEnc}, ${amountEnc}, ${body.icon ?? null}, ${user.id})
    RETURNING id, updated_at
  `;

  await safeLogAction(sql, {
    householdId: membership.household_id,
    actorId: user.id,
    operation: "CREATE",
    resourceType: "savings_account",
    resourceId: row.id,
    before: null,
    after: snapshotSavingsAccount({
      id: row.id,
      name: nameEnc,
      amount: amountEnc,
      icon: body.icon ?? null,
      created_by: user.id,
    }),
  });

  return c.json(
    {
      id: row.id,
      name: body.name,
      amount: body.amount,
      icon: body.icon ?? null,
      createdBy: user.id,
      updatedAt: row.updated_at,
    },
    201,
  );
});

app.patch("/api/savings-accounts/:id", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);
  const id = c.req.param("id");
  const ifMatch = c.req.header("if-match");
  if (!ifMatch) return c.json({ error: "If-Match header is required" }, 400);
  const body = await c.req.json();
  const rawKey = getFinanceDataKey(c);

  const result = await loadSavingsAccountForMutation(
    sql,
    user.id,
    id,
    ifMatch,
    rawKey,
  );
  if (result.error) return c.json(result.error.body, result.error.status);
  const { row } = result;
  const permErr = assertCanMutateResource({
    isOwner: row.household_owner_id === user.id,
    createdBy: row.created_by,
    userId: user.id,
  });
  if (permErr) return c.json(permErr.body, permErr.status);

  const nextName = body.name !== undefined ? body.name : null;
  const nextAmount = body.amount !== undefined ? body.amount : null;
  const nextIcon = body.icon !== undefined ? body.icon : row.icon;
  const nameEnc =
    nextName !== null ? await encryptField(nextName, rawKey) : row.name;
  const amountEnc =
    nextAmount !== null ? await encryptField(nextAmount, rawKey) : row.amount;

  const [updated] = await sql`
    UPDATE savings_accounts
    SET name = ${nameEnc}, amount = ${amountEnc}, icon = ${nextIcon}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING id, icon, updated_at
  `;

  await safeLogAction(sql, {
    householdId: row.household_id,
    actorId: user.id,
    operation: "UPDATE",
    resourceType: "savings_account",
    resourceId: id,
    before: snapshotSavingsAccount(row),
    after: snapshotSavingsAccount({
      id,
      name: nameEnc,
      amount: amountEnc,
      icon: nextIcon,
      created_by: row.created_by,
    }),
  });

  return c.json({
    id: updated.id,
    name: nextName ?? (await decryptField(row.name, rawKey)),
    amount: nextAmount ?? Number(await decryptField(row.amount, rawKey)),
    icon: updated.icon,
    createdBy: row.created_by ?? null,
    updatedAt: updated.updated_at,
  });
});

app.delete("/api/savings-accounts/:id", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);
  const id = c.req.param("id");
  const ifMatch = c.req.header("if-match");
  if (!ifMatch) return c.json({ error: "If-Match header is required" }, 400);
  const rawKey = getFinanceDataKey(c);

  const result = await loadSavingsAccountForMutation(
    sql,
    user.id,
    id,
    ifMatch,
    rawKey,
  );
  if (result.error) return c.json(result.error.body, result.error.status);
  const permErr = assertCanMutateResource({
    isOwner: result.row.household_owner_id === user.id,
    createdBy: result.row.created_by,
    userId: user.id,
  });
  if (permErr) return c.json(permErr.body, permErr.status);

  await sql`DELETE FROM savings_accounts WHERE id = ${id}`;

  await safeLogAction(sql, {
    householdId: result.row.household_id,
    actorId: user.id,
    operation: "DELETE",
    resourceType: "savings_account",
    resourceId: id,
    before: snapshotSavingsAccount(result.row),
    after: null,
  });

  return c.body(null, 204);
});

// ============ CATEGORY BUDGETS (per-row) ============

function validateCategoryBudgetInput(body) {
  if (!body || typeof body !== "object") return "Body must be a JSON object";
  if (typeof body.name !== "string" || !body.name.trim())
    return "name is required";
  if (typeof body.limit !== "number" || !Number.isFinite(body.limit))
    return "limit must be a finite number";
  return null;
}

async function loadCategoryBudgetForMutation(sql, userId, id, ifMatch, rawKey) {
  const [row] = await sql`
    SELECT c.*, h.owner_id AS household_owner_id
    FROM category_budgets c
    JOIN household_members hm ON hm.household_id = c.household_id
    JOIN households h ON h.id = c.household_id
    WHERE c.id = ${id} AND hm.user_id = ${userId}
  `;
  if (!row) {
    const [exists] = await sql`SELECT 1 FROM category_budgets WHERE id = ${id}`;
    return {
      error: {
        status: exists ? 403 : 404,
        body: { error: exists ? "forbidden" : "not found" },
      },
    };
  }
  const updatedAtIso =
    row.updated_at instanceof Date
      ? row.updated_at.toISOString()
      : String(row.updated_at);
  if (updatedAtIso !== ifMatch) {
    return {
      error: {
        status: 409,
        body: {
          error: "conflict",
          current: {
            id: row.id,
            name: await decryptField(row.name, rawKey),
            limit: Number(await decryptField(row.monthly_limit, rawKey)),
            updatedAt: updatedAtIso,
          },
        },
      },
    };
  }
  return { ok: true, row, updatedAtIso };
}

app.post("/api/category-budgets", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);

  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }
  const validationError = validateCategoryBudgetInput(body);
  if (validationError) return c.json({ error: validationError }, 400);

  const [membership] = await sql`
    SELECT household_id FROM household_members WHERE user_id = ${user.id}
  `;
  if (!membership) return c.json({ error: "No household" }, 400);

  const rawKey = getFinanceDataKey(c);
  const nameEnc = await encryptField(body.name, rawKey);
  const limitEnc = await encryptField(body.limit, rawKey);

  const [row] = await sql`
    INSERT INTO category_budgets (household_id, name, monthly_limit, created_by)
    VALUES (${membership.household_id}, ${nameEnc}, ${limitEnc}, ${user.id})
    RETURNING id, updated_at
  `;

  await safeLogAction(sql, {
    householdId: membership.household_id,
    actorId: user.id,
    operation: "CREATE",
    resourceType: "category_budget",
    resourceId: row.id,
    before: null,
    after: snapshotCategoryBudget({
      id: row.id,
      name: nameEnc,
      monthly_limit: limitEnc,
      created_by: user.id,
    }),
  });

  return c.json(
    {
      id: row.id,
      name: body.name,
      limit: body.limit,
      createdBy: user.id,
      updatedAt: row.updated_at,
    },
    201,
  );
});

app.patch("/api/category-budgets/:id", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);
  const id = c.req.param("id");
  const ifMatch = c.req.header("if-match");
  if (!ifMatch) return c.json({ error: "If-Match header is required" }, 400);
  const body = await c.req.json();
  const rawKey = getFinanceDataKey(c);

  const result = await loadCategoryBudgetForMutation(
    sql,
    user.id,
    id,
    ifMatch,
    rawKey,
  );
  if (result.error) return c.json(result.error.body, result.error.status);
  const { row } = result;
  const permErr = assertCanMutateResource({
    isOwner: row.household_owner_id === user.id,
    createdBy: row.created_by,
    userId: user.id,
  });
  if (permErr) return c.json(permErr.body, permErr.status);

  const nextName = body.name !== undefined ? body.name : null;
  const nextLimit = body.limit !== undefined ? body.limit : null;
  const nameEnc =
    nextName !== null ? await encryptField(nextName, rawKey) : row.name;
  const limitEnc =
    nextLimit !== null
      ? await encryptField(nextLimit, rawKey)
      : row.monthly_limit;

  const [updated] = await sql`
    UPDATE category_budgets
    SET name = ${nameEnc}, monthly_limit = ${limitEnc}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING id, updated_at
  `;

  await safeLogAction(sql, {
    householdId: row.household_id,
    actorId: user.id,
    operation: "UPDATE",
    resourceType: "category_budget",
    resourceId: id,
    before: snapshotCategoryBudget(row),
    after: snapshotCategoryBudget({
      id,
      name: nameEnc,
      monthly_limit: limitEnc,
      created_by: row.created_by,
    }),
  });

  return c.json({
    id: updated.id,
    name: nextName ?? (await decryptField(row.name, rawKey)),
    limit: nextLimit ?? Number(await decryptField(row.monthly_limit, rawKey)),
    createdBy: row.created_by ?? null,
    updatedAt: updated.updated_at,
  });
});

app.delete("/api/category-budgets/:id", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);
  const id = c.req.param("id");
  const ifMatch = c.req.header("if-match");
  if (!ifMatch) return c.json({ error: "If-Match header is required" }, 400);
  const rawKey = getFinanceDataKey(c);

  const result = await loadCategoryBudgetForMutation(
    sql,
    user.id,
    id,
    ifMatch,
    rawKey,
  );
  if (result.error) return c.json(result.error.body, result.error.status);
  const permErr = assertCanMutateResource({
    isOwner: result.row.household_owner_id === user.id,
    createdBy: result.row.created_by,
    userId: user.id,
  });
  if (permErr) return c.json(permErr.body, permErr.status);

  await sql`DELETE FROM category_budgets WHERE id = ${id}`;

  await safeLogAction(sql, {
    householdId: result.row.household_id,
    actorId: user.id,
    operation: "DELETE",
    resourceType: "category_budget",
    resourceId: id,
    before: snapshotCategoryBudget(result.row),
    after: null,
  });

  return c.body(null, 204);
});

// ============ SAVINGS GOAL (singleton per household) ============

function validateSavingsGoalInput(body) {
  if (!body || typeof body !== "object") return "Body must be a JSON object";
  if (
    body.type !== "none" &&
    body.type !== "monthly" &&
    body.type !== "yearly"
  ) {
    return "type must be 'none' | 'monthly' | 'yearly'";
  }
  return null;
}

app.put("/api/savings-goal", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);

  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }
  const validationError = validateSavingsGoalInput(body);
  if (validationError) return c.json({ error: validationError }, 400);

  const [membership] = await sql`
    SELECT hm.household_id, h.owner_id
    FROM household_members hm
    JOIN households h ON h.id = hm.household_id
    WHERE hm.user_id = ${user.id}
  `;
  if (!membership) return c.json({ error: "No household" }, 400);
  // savings_goal to singleton bez `created_by` — przyjmujemy że tylko owner gospodarstwa
  // może go zmieniać (członek nie ma "swojej" wersji celu).
  if (membership.owner_id !== user.id) {
    return c.json({ error: "forbidden_owner_only" }, 403);
  }

  const rawKey = getFinanceDataKey(c);
  const monthlyEnc = await encryptField(body.monthlyAmount ?? 0, rawKey);
  const yearlyEnc = await encryptField(body.yearlyAmount ?? 0, rawKey);
  const targetMonth = Number.isInteger(body.targetMonth)
    ? body.targetMonth
    : 11;

  // Pobierz `before` przed upsertem — singleton, więc resource_id = household_id.
  const [existing] = await sql`
    SELECT type, monthly_amount, yearly_amount, target_month
    FROM savings_goals WHERE household_id = ${membership.household_id}
  `;

  await sql`
    INSERT INTO savings_goals (household_id, type, monthly_amount, yearly_amount, target_month, updated_at)
    VALUES (${membership.household_id}, ${body.type}, ${monthlyEnc}, ${yearlyEnc}, ${targetMonth}, NOW())
    ON CONFLICT (household_id) DO UPDATE SET
      type = EXCLUDED.type,
      monthly_amount = EXCLUDED.monthly_amount,
      yearly_amount = EXCLUDED.yearly_amount,
      target_month = EXCLUDED.target_month,
      updated_at = NOW()
  `;

  await safeLogAction(sql, {
    householdId: membership.household_id,
    actorId: user.id,
    operation: existing ? "UPDATE" : "CREATE",
    resourceType: "savings_goal",
    resourceId: membership.household_id,
    before: existing ? snapshotSavingsGoal(existing) : null,
    after: snapshotSavingsGoal({
      type: body.type,
      monthly_amount: monthlyEnc,
      yearly_amount: yearlyEnc,
      target_month: targetMonth,
    }),
  });

  return c.json({
    type: body.type,
    monthlyAmount: Number(body.monthlyAmount ?? 0),
    yearlyAmount: Number(body.yearlyAmount ?? 0),
    targetMonth,
  });
});

// ============ TUYA CREDENTIALS (Slice 1) ============
//
// Każde gospodarstwo ma własne konto Tuya. Owner wpisuje poświadczenia w panelu;
// trzymamy je zaszyfrowane (ff1:… AES-GCM, FINANCE_DATA_KEY). client_secret nigdy
// nie wraca do frontu. Tylko owner gospodarstwa zarządza integracją.

const TUYA_DATACENTERS = ["eu", "us", "cn", "in"];

function validateTuyaCredentialsInput(body) {
  if (!body || typeof body !== "object") return "Body must be a JSON object";
  if (typeof body.clientId !== "string" || !body.clientId.trim())
    return "clientId is required";
  if (typeof body.clientSecret !== "string" || !body.clientSecret.trim())
    return "clientSecret is required";
  if (
    body.datacenter !== undefined &&
    !TUYA_DATACENTERS.includes(body.datacenter)
  ) {
    return "datacenter must be one of eu|us|cn|in";
  }
  const price = body.energyPricePln;
  if (
    price !== undefined &&
    price !== null &&
    (typeof price !== "number" ||
      !Number.isFinite(price) ||
      price < 0 ||
      price > 100)
  ) {
    return "energyPricePln must be a number 0-100 or null";
  }
  return null;
}

/** Zwraca { household_id, owner_id } gospodarstwa usera albo null. */
async function getMembershipWithOwner(sql, userId) {
  const [m] = await sql`
    SELECT hm.household_id, h.owner_id
    FROM household_members hm
    JOIN households h ON h.id = hm.household_id
    WHERE hm.user_id = ${userId}
  `;
  return m ?? null;
}

const toIso = (v) =>
  v instanceof Date ? v.toISOString() : v == null ? null : String(v);

app.put("/api/tuya/credentials", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);

  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }
  const validationError = validateTuyaCredentialsInput(body);
  if (validationError) return c.json({ error: validationError }, 400);

  const membership = await getMembershipWithOwner(sql, user.id);
  if (!membership) return c.json({ error: "No household" }, 400);
  if (membership.owner_id !== user.id)
    return c.json({ error: "forbidden_owner_only" }, 403);

  const datacenter = body.datacenter ?? "eu";

  // Weryfikacja: udany token = poświadczenia poprawne. Bez tego nie zapisujemy.
  try {
    await getTuyaToken({
      clientId: body.clientId,
      clientSecret: body.clientSecret,
      datacenter,
    });
  } catch (err) {
    console.error("[tuya] credential verification failed", err);
    return c.json({ error: "tuya_auth_failed" }, 400);
  }

  const rawKey = getFinanceDataKey(c);
  const clientIdEnc = await encryptField(body.clientId, rawKey);
  const clientSecretEnc = await encryptField(body.clientSecret, rawKey);

  const energyPricePln = body.energyPricePln ?? null;
  const [row] = await sql`
    INSERT INTO tuya_credentials
      (household_id, client_id_enc, client_secret_enc, datacenter, energy_price_pln, verified_at, created_by, updated_at)
    VALUES
      (${membership.household_id}, ${clientIdEnc}, ${clientSecretEnc},
       ${datacenter}, ${energyPricePln}, NOW(), ${user.id}, NOW())
    ON CONFLICT (household_id) DO UPDATE SET
      client_id_enc = EXCLUDED.client_id_enc,
      client_secret_enc = EXCLUDED.client_secret_enc,
      datacenter = EXCLUDED.datacenter,
      energy_price_pln = EXCLUDED.energy_price_pln,
      verified_at = NOW(),
      updated_at = NOW()
    RETURNING datacenter, verified_at, energy_price_pln
  `;

  return c.json({
    configured: true,
    datacenter: row.datacenter,
    verifiedAt: toIso(row.verified_at),
    energyPricePln:
      row.energy_price_pln == null ? null : Number(row.energy_price_pln),
  });
});

// Aktualizacja samej ceny kWh — bez ponownej weryfikacji poświadczeń (cena to
// ustawienie domowe, nie sekret). Pozwala zmienić cenę bez wpisywania Client ID/Secret,
// których front nigdy nie posiada (nie wracają z GET).
app.patch("/api/tuya/credentials/price", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);

  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const membership = await getMembershipWithOwner(sql, user.id);
  if (!membership) return c.json({ error: "No household" }, 400);
  if (membership.owner_id !== user.id)
    return c.json({ error: "forbidden_owner_only" }, 403);

  const price = body?.energyPricePln ?? null;
  if (
    price !== null &&
    (typeof price !== "number" || !Number.isFinite(price) || price < 0 || price > 100)
  ) {
    return c.json({ error: "energyPricePln must be a number 0-100 or null" }, 400);
  }

  const [row] = await sql`
    UPDATE tuya_credentials
    SET energy_price_pln = ${price}, updated_at = NOW()
    WHERE household_id = ${membership.household_id}
    RETURNING energy_price_pln
  `;
  if (!row) return c.json({ error: "not_configured" }, 400);
  return c.json({
    energyPricePln: row.energy_price_pln == null ? null : Number(row.energy_price_pln),
  });
});

app.get("/api/tuya/credentials", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);

  const membership = await getMembershipWithOwner(sql, user.id);
  if (!membership) return c.json({ error: "No household" }, 400);
  if (membership.owner_id !== user.id)
    return c.json({ error: "forbidden_owner_only" }, 403);

  const [row] = await sql`
    SELECT datacenter, verified_at, energy_price_pln
    FROM tuya_credentials WHERE household_id = ${membership.household_id}
  `;
  if (!row) return c.json({ configured: false });
  // Nigdy nie zwracamy client_secret/client_id.
  return c.json({
    configured: true,
    datacenter: row.datacenter,
    verifiedAt: toIso(row.verified_at),
    energyPricePln:
      row.energy_price_pln == null ? null : Number(row.energy_price_pln),
  });
});

app.delete("/api/tuya/credentials", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);

  const membership = await getMembershipWithOwner(sql, user.id);
  if (!membership) return c.json({ error: "No household" }, 400);
  if (membership.owner_id !== user.id)
    return c.json({ error: "forbidden_owner_only" }, 403);

  await sql`DELETE FROM tuya_credentials WHERE household_id = ${membership.household_id}`;
  return c.body(null, 204);
});

// ============ SMARTTHINGS (OAuth-In, Faza 1) ============
//
// JEDEN OAuth-In SmartApp na apkę (SMARTTHINGS_CLIENT_ID/SECRET w env). Tokeny per
// gospodarstwo zaszyfrowane w smartthings_credentials. Łączenie/rozłączanie owner-only;
// status widoczny dla członków. Tokeny nigdy nie wracają do frontu.

const SMARTTHINGS_SCOPES = ["r:locations:*", "r:devices:*", "x:devices:*"];

function smartthingsRedirectUri(c) {
  return (
    getEnv(c, "SMARTTHINGS_REDIRECT_URI") ||
    `${getApiBaseUrl(c)}/api/smartthings/callback`
  );
}

// Owner inicjuje OAuth → redirect na ekran zgody Samsung.
app.get("/api/smartthings/connect", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);
  const membership = await getMembershipWithOwner(sql, user.id);
  if (!membership) return c.json({ error: "No household" }, 400);
  if (membership.owner_id !== user.id)
    return c.json({ error: "forbidden_owner_only" }, 403);

  const clientId = getEnv(c, "SMARTTHINGS_CLIENT_ID");
  if (!clientId) return c.json({ error: "config_smartthings" }, 500);

  const url = buildAuthorizeUrl({
    clientId,
    redirectUri: smartthingsRedirectUri(c),
    scopes: SMARTTHINGS_SCOPES,
    state: crypto.randomUUID(),
  });
  return c.redirect(url);
});

// Callback Samsung: wymiana code → tokeny → zapis zaszyfrowany. Redirect na front.
app.get("/api/smartthings/callback", async (c) => {
  const frontend = getEnv(c, "FRONTEND_URL") || "http://localhost:5173";
  const fail = (st) => c.redirect(`${frontend}/?view=urzadzenia&st=${st}`);

  if (c.req.query("error")) return fail("error");
  const code = c.req.query("code");
  if (!code) return fail("error");

  try {
    // User jest zalogowany (cookie leci przy top-level redirect) — ustal gospodarstwo.
    const token = parseCookie(c.req.header("cookie"), "token");
    const { payload } = await jwtVerify(token, getSecret(c));
    const sql = getDb(c);
    const [user] = await sql`SELECT id FROM users WHERE id = ${payload.userId}`;
    if (!user) return fail("error");
    const membership = await getMembershipWithOwner(sql, user.id);
    if (!membership || membership.owner_id !== user.id) return fail("error");

    const tokens = await exchangeCodeForTokens({
      code,
      clientId: getEnv(c, "SMARTTHINGS_CLIENT_ID"),
      clientSecret: getEnv(c, "SMARTTHINGS_CLIENT_SECRET"),
      redirectUri: smartthingsRedirectUri(c),
    });

    await saveTokens(sql, {
      householdId: membership.household_id,
      tokens,
      scopes: tokens.scope,
      createdBy: user.id,
      rawKey: getFinanceDataKey(c),
    });
    return fail("connected");
  } catch (err) {
    console.error("[smartthings/callback]", err);
    return fail(err?.code === "invalid_grant" ? "reconnect" : "error");
  }
});

// Status połączenia — bez tokenów. Widoczny dla każdego członka gospodarstwa.
app.get("/api/smartthings/status", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);
  const membership = await getMembershipWithOwner(sql, user.id);
  if (!membership) return c.json({ connected: false });
  const [row] = await sql`
    SELECT verified_at FROM smartthings_credentials WHERE household_id = ${membership.household_id}
  `;
  if (!row) return c.json({ connected: false });
  return c.json({ connected: true, verifiedAt: toIso(row.verified_at) });
});

// Rozłączenie — owner-only. Kasuje poświadczenia (urządzenia ST dojdą w Fazie 2).
app.delete("/api/smartthings/disconnect", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);
  const membership = await getMembershipWithOwner(sql, user.id);
  if (!membership) return c.json({ error: "No household" }, 400);
  if (membership.owner_id !== user.id)
    return c.json({ error: "forbidden_owner_only" }, 403);
  // Rozłączenie kasuje też urządzenia ST (RODO + nie zostawiamy martwych kart bez tokenów).
  // Urządzenia Tuya zostają nietknięte.
  await sql`DELETE FROM smart_devices WHERE household_id = ${membership.household_id} AND provider = 'smartthings'`;
  await sql`DELETE FROM smartthings_credentials WHERE household_id = ${membership.household_id}`;
  return c.body(null, 204);
});

// ============ SMART DEVICES (Tuya — Slice 2) ============
//
// N urządzeń per gospodarstwo. Poświadczenia (jedne) z tuya_credentials.
// Zarządzanie (dodaj/usuń/edytuj) owner-only; podgląd statusu member+.

/** Deszyfruje poświadczenia gospodarstwa i pobiera token → ctx dla wywołań urządzeń. Null gdy brak konfiguracji. */
async function loadTuyaContext(c, sql, householdId) {
  const [cred] = await sql`
    SELECT client_id_enc, client_secret_enc, datacenter
    FROM tuya_credentials WHERE household_id = ${householdId}
  `;
  if (!cred) return null;
  const rawKey = getFinanceDataKey(c);
  const clientId = await decryptField(cred.client_id_enc, rawKey);
  const clientSecret = await decryptField(cred.client_secret_enc, rawKey);
  const { accessToken } = await getTuyaToken({
    clientId,
    clientSecret,
    datacenter: cred.datacenter,
  });
  return { clientId, clientSecret, datacenter: cred.datacenter, accessToken };
}

function mapDevice(row) {
  return {
    id: row.id,
    provider: row.provider ?? "tuya",
    externalDeviceId: row.external_device_id ?? row.tuya_device_id ?? null,
    tuyaDeviceId: row.tuya_device_id ?? null,
    capabilitiesJson: row.capabilities_json ?? null,
    displayName: row.display_name,
    productName: row.product_name ?? null,
    productId: row.product_id ?? null,
    deviceType: row.device_type ?? null,
    irParentId: row.ir_parent_id ?? null,
    linkedPlugId: row.linked_plug_id ?? null,
    cycleLabels: row.cycle_labels ?? null,
    functionsJson: row.functions_json ?? null,
    isActive: row.is_active,
    createdBy: row.created_by ?? null,
    updatedAt: toIso(row.updated_at),
  };
}

app.get("/api/smart-devices", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);
  const [membership] = await sql`
    SELECT household_id FROM household_members WHERE user_id = ${user.id}
  `;
  if (!membership) return c.json({ devices: [] });
  const rows = await sql`
    SELECT * FROM smart_devices WHERE household_id = ${membership.household_id}
    ORDER BY created_at ASC
  `;
  return c.json({ devices: rows.map(mapDevice) });
});

/** Status pojedynczego urządzenia po odczycie z Tuya (graceful gdy Tuya nie odpowiada). */
function deviceStatusPayload(row, formatted) {
  return {
    id: row.id,
    tuyaDeviceId: row.tuya_device_id ?? row.tuyaDeviceId,
    ok: true,
    online: true,
    ...formatted,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Odczyt statusu jednego urządzenia z Tuya, z rozgałęzieniem na klimę IR.
 * Klima IR nie ma DP — jej stan idzie z AC API i ląduje w polu `ac` { power, mode, temp, wind }.
 * @returns {Promise<object>} payload statusu (bez statystyk dziennych — dokłada caller)
 */
async function readDeviceStatus(ctx, row, sql) {
  if (row.device_type === "ir_ac") {
    let ac = formatAcStatus(
      await getAcStatus(ctx, row.ir_parent_id, row.tuya_device_id),
    );
    let switchOn = ac.power === 1;
    let plugW;
    if (row.linked_plug_id && sql) {
      try {
        const [plug] =
          await sql`SELECT tuya_device_id FROM smart_devices WHERE id = ${row.linked_plug_id}`;
        if (plug) {
          plugW = await readPlugPowerW(ctx, plug.tuya_device_id);
          const plugOn = acPowerOnFromPlugW(plugW);
          if (plugOn != null) {
            switchOn = plugOn;
            ac = reconcileAcPower(ac, plugOn);
          }
        }
      } catch (err) {
        console.warn("[smart-devices] ir_ac plug read failed", row.id, err);
      }
    }
    return {
      ...deviceStatusPayload(row, {
        ac,
        switchOn,
        ...(plugW != null ? { plugW, linked: true } : {}),
      }),
    };
  }
  if (row.device_type === "ir_remote") {
    // Pilot IR jest bezstanowy. Jeśli powiązany z gniazdkiem — realny stan zestawu z poboru mocy.
    if (row.linked_plug_id && sql) {
      const [plug] =
        await sql`SELECT tuya_device_id FROM smart_devices WHERE id = ${row.linked_plug_id}`;
      if (plug) {
        const f = formatStatuses(
          await getDeviceStatus(ctx, plug.tuya_device_id),
        );
        const w = f.powerW ?? 0;
        return deviceStatusPayload(row, {
          plugW: w,
          switchOn: w > IR_PLUG_STANDBY_W,
          linked: true,
        });
      }
    }
    return deviceStatusPayload(row, {});
  }
  return deviceStatusPayload(
    row,
    formatStatuses(await getDeviceStatus(ctx, row.tuya_device_id)),
  );
}

// Sync snapshotów mocy leci cronem co 15 min — czas działania szacujemy jako
// liczba próbek "włączone" × 15 min.
const SNAPSHOT_INTERVAL_MIN = 15;

/**
 * Statystyki dzisiejsze (od północy czasu warszawskiego) per urządzenie:
 *  - kwh: zużycie z DISTINCT paczek add_ele (ta sama logika co w /history),
 *  - uptimeMin: szacowany czas poboru mocy z próbek (tylko power_w > 0; włączone bez poboru nie liczy się).
 * Zwraca mapę device_id → { kwh, uptimeMin }.
 */
async function getTodayStatsByDevice(sql, deviceIds) {
  if (deviceIds.length === 0) return {};
  const energyRows = await sql`
    SELECT device_id, COALESCE(SUM(energy_kwh), 0)::float8 AS kwh FROM (
      SELECT DISTINCT ON (device_id, energy_reported_at) device_id, energy_kwh
      FROM device_energy_snapshots
      WHERE device_id = ANY(${deviceIds}) AND energy_reported_at IS NOT NULL
        AND energy_reported_at >= date_trunc('day', NOW() AT TIME ZONE 'Europe/Warsaw') AT TIME ZONE 'Europe/Warsaw'
      ORDER BY device_id, energy_reported_at, recorded_at
    ) s
    GROUP BY device_id
  `;
  const uptimeRows = await sql`
    SELECT device_id, count(*)::int AS on_samples
    FROM device_energy_snapshots
    WHERE device_id = ANY(${deviceIds}) AND energy_reported_at IS NULL
      AND recorded_at >= date_trunc('day', NOW() AT TIME ZONE 'Europe/Warsaw') AT TIME ZONE 'Europe/Warsaw'
      AND power_w > 0
    GROUP BY device_id
  `;
  const stats = {};
  for (const id of deviceIds) stats[id] = { kwh: 0, uptimeMin: 0 };
  for (const r of energyRows) stats[r.device_id].kwh = Number(r.kwh);
  for (const r of uptimeRows)
    stats[r.device_id].uptimeMin = Number(r.on_samples) * SNAPSHOT_INTERVAL_MIN;
  return stats;
}

// Discover: urządzenia z powiązanego konta (owner-only). Statyczna ścieżka przed /:id.
app.get("/api/smart-devices/discover", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);
  const membership = await getMembershipWithOwner(sql, user.id);
  if (!membership) return c.json({ error: "No household" }, 400);
  if (membership.owner_id !== user.id)
    return c.json({ error: "forbidden_owner_only" }, 403);

  const ctx = await loadTuyaContext(c, sql, membership.household_id);
  if (!ctx) return c.json({ error: "tuya_not_configured" }, 400);

  let result;
  try {
    result = await listProjectDevices(ctx);
  } catch (err) {
    console.error("[smart-devices] discover failed", err);
    return c.json({ error: "tuya_unavailable" }, 502);
  }
  const devices = (result?.devices ?? []).map((d) => ({
    id: d.id,
    name: d.name ?? null,
    online: d.online ?? d.isOnline ?? false,
  }));
  return c.json({ devices });
});

// ============ SMART DEVICES (SmartThings — Faza 2) ============
//
// Osobne endpointy od Tuya (rozdzielona logika providerów; Tuya bez zmian). Tokeny ST
// trzymane per gospodarstwo w smartthings_credentials (Faza 1). Import owner-only.

/** Ważny access token ST dla gospodarstwa → ctx do wywołań klienta. Null gdy nie połączono. */
async function loadStContext(c, sql, householdId) {
  const accessToken = await getFreshAccessToken(sql, {
    householdId,
    clientId: getEnv(c, "SMARTTHINGS_CLIENT_ID"),
    clientSecret: getEnv(c, "SMARTTHINGS_CLIENT_SECRET"),
    rawKey: getFinanceDataKey(c),
  });
  if (!accessToken) return null;
  return { accessToken };
}

/** Status jednego urządzenia ST przez mapper (czytelny UI-model, nie surowy JSON). */
async function readStStatus(stCtx, row) {
  const status = await getStDeviceStatus(stCtx, row.external_device_id);
  return {
    id: row.id,
    provider: "smartthings",
    externalDeviceId: row.external_device_id,
    ok: true,
    online: true,
    ...mapStStatus(status, row.device_type, row.cycle_labels),
    // Dozwolone akcje sterowania (Faza 4) — UI rysuje tylko wspierane przyciski.
    controls: allowedStActions(row.device_type, status),
    updatedAt: new Date().toISOString(),
  };
}

/** Payload urządzenia ST, które nie odpowiedziało (offline / błąd ST). */
function stOfflinePayload(row) {
  return {
    id: row.id,
    provider: "smartthings",
    externalDeviceId: row.external_device_id,
    ok: false,
    online: false,
  };
}

/**
 * Koszt cyklu (Faza 5): pralka ST nie mierzy kWh sama — gdy powiązana z gniazdkiem Tuya,
 * dokładamy bieżącą moc + zużycie dziś z tego gniazdka. Błąd gniazdka = stan ST bez poboru.
 */
async function enrichStWithPlug(base, row, tuyaCtx, sql) {
  if (!row.linked_plug_id || !tuyaCtx) return base;
  const [plug] =
    await sql`SELECT id, tuya_device_id FROM smart_devices WHERE id = ${row.linked_plug_id}`;
  if (!plug) return base;
  try {
    const f = formatStatuses(
      await getDeviceStatus(tuyaCtx, plug.tuya_device_id),
    );
    const today = await getTodayStatsByDevice(sql, [plug.id]);
    return {
      ...base,
      linked: true,
      plugW: f.powerW ?? 0,
      todayKwh: today[plug.id]?.kwh ?? 0,
    };
  } catch (err) {
    console.error(
      "[smart-devices] ST plug read failed",
      plug.tuya_device_id,
      err,
    );
    return base;
  }
}

/**
 * Sterowanie urządzeniem ST (Faza 4) — member+. Waliduje względem capabilities (snapshot)
 * i bramki zdalnego sterowania PRZED wysłaniem; loguje udaną komendę. Komunikaty PL.
 */
async function runStCommand(c, sql, user, row) {
  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }
  const action = body?.action;
  // Dwa kontrakty: { action } (start/pauza/stop) lub { setting, value } (temperatura,
  // wirowanie, płukanie, namaczanie, program — tylko pralka).
  const isSetting = body?.setting != null;

  // Walidacja względem capabilities — spoza zakresu nie idzie do ST.
  const cmd = isSetting
    ? buildStSettingCommand(row.device_type, body.setting, body.value)
    : buildStCommand(row.device_type, action);
  if (!cmd) {
    return c.json(
      {
        error: "command_not_supported",
        message: "Tej akcji nie można wykonać na tym urządzeniu.",
      },
      400,
    );
  }

  const ctx = await loadStContext(c, sql, row.household_id);
  if (!ctx)
    return c.json(
      {
        error: "smartthings_not_connected",
        message: "Konto SmartThings nie jest połączone.",
      },
      400,
    );

  let status;
  try {
    status = await getStDeviceStatus(ctx, row.external_device_id);
  } catch (err) {
    console.error("[smart-devices] ST status before command failed", err);
    return c.json(
      {
        error: "device_unreachable",
        message: "Urządzenie nie odpowiada (offline).",
      },
      502,
    );
  }

  // Bramka Samsung: bez fizycznie włączonego zdalnego sterowania ST odrzuca komendy.
  if (isSetting) {
    const allowed = allowedStSetting(
      row.device_type,
      status,
      body.setting,
      body.value,
    );
    if (allowed.reason === "remote_control_disabled") {
      return c.json(
        {
          error: "remote_control_disabled",
          message:
            "Włącz zdalne sterowanie na pralce, aby zmienić ustawienia z aplikacji.",
        },
        409,
      );
    }
    if (!allowed.ok) {
      return c.json(
        {
          error: "setting_not_available",
          message:
            "Tej wartości nie można teraz ustawić (sprawdź program i stan pralki).",
        },
        409,
      );
    }
  } else {
    const allowed = allowedStActions(row.device_type, status);
    if (!allowed.remoteControlEnabled) {
      return c.json(
        {
          error: "remote_control_disabled",
          message:
            "Włącz zdalne sterowanie na pralce, aby sterować nią z aplikacji.",
        },
        409,
      );
    }
    if (!allowed.actions.includes(action)) {
      return c.json(
        {
          error: "action_not_available",
          message:
            "Nie można teraz wykonać tej akcji (sprawdź stan urządzenia).",
        },
        409,
      );
    }
  }

  try {
    await sendStCommand(ctx, row.external_device_id, cmd);
  } catch (err) {
    console.error("[smart-devices] ST command failed", err);
    return c.json(
      {
        error: "command_failed",
        message:
          "Urządzenie nie przyjęło komendy (zajęte lub offline). Spróbuj ponownie.",
      },
      502,
    );
  }

  // Audyt po udanym wysłaniu (kto/kiedy/co). Błąd logu nie wywala akcji.
  const logCode = isSetting ? `setting:${body.setting}` : action;
  const logValue = isSetting ? String(body.value) : JSON.stringify(cmd);
  try {
    await sql`
      INSERT INTO device_command_log (household_id, device_id, actor_id, code, value)
      VALUES (${row.household_id}, ${row.id}, ${user.id}, ${logCode}, ${logValue})
    `;
  } catch (err) {
    console.error("[device-command-log] ST insert failed", err);
  }

  return c.json({ ok: true });
}

// Discover ST: urządzenia z połączonego konta (owner-only). Już dodane w tym
// gospodarstwie odfiltrowane. Statyczna ścieżka — bez kolizji z /:id (brak GET /:id).
app.get(
  "/api/smart-devices/discover-smartthings",
  authMiddleware,
  async (c) => {
    const user = c.get("user");
    const sql = getDb(c);
    const membership = await getMembershipWithOwner(sql, user.id);
    if (!membership) return c.json({ error: "No household" }, 400);
    if (membership.owner_id !== user.id)
      return c.json({ error: "forbidden_owner_only" }, 403);

    const ctx = await loadStContext(c, sql, membership.household_id);
    if (!ctx) return c.json({ error: "smartthings_not_connected" }, 400);

    let raw;
    try {
      raw = await getStDevices(ctx);
    } catch (err) {
      console.error("[smart-devices] ST discover failed", err);
      if (err?.status === 401) return c.json({ error: "reconnect" }, 400);
      return c.json({ error: "smartthings_unavailable" }, 502);
    }

    const added = await sql`
    SELECT external_device_id FROM smart_devices
    WHERE household_id = ${membership.household_id} AND provider = 'smartthings'
  `;
    const addedIds = new Set(added.map((r) => r.external_device_id));
    const devices = summarizeDevices({ items: raw }).filter(
      (d) => !addedIds.has(d.deviceId),
    );
    return c.json({ devices });
  },
);

// Dodanie urządzenia ST (owner-only): profil + snapshot capabilities → karta provider=smartthings.
app.post("/api/smart-devices/smartthings", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);

  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }
  if (
    typeof body?.externalDeviceId !== "string" ||
    !body.externalDeviceId.trim()
  ) {
    return c.json({ error: "externalDeviceId is required" }, 400);
  }
  const externalDeviceId = body.externalDeviceId.trim();

  const membership = await getMembershipWithOwner(sql, user.id);
  if (!membership) return c.json({ error: "No household" }, 400);
  if (membership.owner_id !== user.id)
    return c.json({ error: "forbidden_owner_only" }, 403);

  // Duplikat (UNIQUE(provider, external_device_id)) — to samo urządzenie w jakimkolwiek gospodarstwie.
  const [dupe] = await sql`
    SELECT 1 FROM smart_devices WHERE provider = 'smartthings' AND external_device_id = ${externalDeviceId}
  `;
  if (dupe) return c.json({ error: "device_already_linked" }, 409);

  const ctx = await loadStContext(c, sql, membership.household_id);
  if (!ctx) return c.json({ error: "smartthings_not_connected" }, 400);

  let device;
  try {
    device = await getStDevice(ctx, externalDeviceId);
  } catch (err) {
    console.error("[smart-devices] ST getDevice failed", err);
    return c.json({ error: "device_not_found_in_smartthings" }, 404);
  }

  const displayName =
    typeof body.displayName === "string" && body.displayName.trim()
      ? body.displayName.trim()
      : device?.label || device?.name || externalDeviceId;
  const deviceType = inferDeviceType(device);

  const [row] = await sql`
    INSERT INTO smart_devices
      (household_id, provider, external_device_id, display_name, product_name,
       device_type, capabilities_json, created_by)
    VALUES
      (${membership.household_id}, 'smartthings', ${externalDeviceId}, ${displayName},
       ${device?.deviceManufacturerCode ?? device?.manufacturerName ?? null},
       ${deviceType}, ${JSON.stringify(device?.components ?? [])}, ${user.id})
    RETURNING *
  `;
  return c.json(mapDevice(row), 201);
});

// Batch status wszystkich aktywnych urządzeń (member+). Jeden błąd nie wywala reszty.
app.get("/api/smart-devices/status", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);
  const [membership] = await sql`
    SELECT household_id FROM household_members WHERE user_id = ${user.id}
  `;
  if (!membership) return c.json({ statuses: [] });

  const rows = await sql`
    SELECT id, provider, external_device_id, tuya_device_id, device_type, ir_parent_id, linked_plug_id, cycle_labels FROM smart_devices
    WHERE household_id = ${membership.household_id} AND is_active = true
    ORDER BY created_at ASC
  `;
  if (rows.length === 0) return c.json({ statuses: [] });

  const tuyaRows = rows.filter((r) => r.provider !== "smartthings");
  const stRows = rows.filter((r) => r.provider === "smartthings");

  // Tuya: jeden kontekst + statystyki energii (jak dotąd). 400 tylko gdy są urządzenia Tuya.
  // Kontekst Tuya współdzielony z odczytem gniazdek powiązanych z urządzeniami ST (koszt).
  let tuyaCtx = null;
  let tuyaStatuses = [];
  if (tuyaRows.length > 0) {
    tuyaCtx = await loadTuyaContext(c, sql, membership.household_id);
    if (!tuyaCtx) return c.json({ error: "tuya_not_configured" }, 400);
    const todayByDevice = await getTodayStatsByDevice(
      sql,
      tuyaRows.map((r) => r.id),
    );
    tuyaStatuses = await Promise.all(
      tuyaRows.map(async (r) => {
        try {
          const today = todayByDevice[r.id] ?? { kwh: 0, uptimeMin: 0 };
          return {
            ...(await readDeviceStatus(tuyaCtx, r, sql)),
            todayKwh: today.kwh,
            todayUptimeMin: today.uptimeMin,
          };
        } catch (err) {
          console.error("[smart-devices] status failed", r.tuya_device_id, err);
          return {
            id: r.id,
            tuyaDeviceId: r.tuya_device_id,
            ok: false,
            online: false,
          };
        }
      }),
    );
  } else if (stRows.some((r) => r.linked_plug_id)) {
    // Brak własnych urządzeń Tuya, ale ST powiązane z gniazdkiem → potrzebny kontekst Tuya.
    tuyaCtx = await loadTuyaContext(c, sql, membership.household_id);
  }

  // SmartThings: jeden kontekst, mapper per urządzenie; błąd jednego = offline, nie wywala reszty.
  let stStatuses = [];
  if (stRows.length > 0) {
    const stCtx = await loadStContext(c, sql, membership.household_id);
    stStatuses = await Promise.all(
      stRows.map(async (r) => {
        if (!stCtx) return stOfflinePayload(r);
        try {
          return await enrichStWithPlug(
            await readStStatus(stCtx, r),
            r,
            tuyaCtx,
            sql,
          );
        } catch (err) {
          console.error(
            "[smart-devices] ST status failed",
            r.external_device_id,
            err,
          );
          return stOfflinePayload(r);
        }
      }),
    );
  }

  return c.json({ statuses: [...tuyaStatuses, ...stStatuses] });
});

app.get("/api/smart-devices/:id/status", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);
  const id = c.req.param("id");

  const result = await loadDeviceInHousehold(sql, user.id, id);
  if (result.error) return c.json(result.error.body, result.error.status);

  if (result.row.provider === "smartthings") {
    const stCtx = await loadStContext(c, sql, result.row.household_id);
    if (!stCtx) return c.json({ error: "smartthings_not_connected" }, 400);
    try {
      const tuyaCtx = result.row.linked_plug_id
        ? await loadTuyaContext(c, sql, result.row.household_id)
        : null;
      return c.json(
        await enrichStWithPlug(
          await readStStatus(stCtx, result.row),
          result.row,
          tuyaCtx,
          sql,
        ),
      );
    } catch (err) {
      console.error("[smart-devices] single ST status failed", err);
      return c.json(stOfflinePayload(result.row));
    }
  }

  const ctx = await loadTuyaContext(c, sql, result.row.household_id);
  if (!ctx) return c.json({ error: "tuya_not_configured" }, 400);

  try {
    const todayByDevice = await getTodayStatsByDevice(sql, [result.row.id]);
    const today = todayByDevice[result.row.id] ?? { kwh: 0, uptimeMin: 0 };
    return c.json({
      ...(await readDeviceStatus(ctx, result.row, sql)),
      todayKwh: today.kwh,
      todayUptimeMin: today.uptimeMin,
    });
  } catch (err) {
    console.error("[smart-devices] single status failed", err);
    return c.json({
      id: result.row.id,
      tuyaDeviceId: result.row.tuya_device_id,
      ok: false,
      online: false,
    });
  }
});

// Historia zużycia (member+). Agregacja po stronie DB, bucket rośnie z zakresem.
const HISTORY_RANGES = {
  "1d": { interval: "1 day", bucketSec: 900 }, // co 15 min (częstotliwość crona)
  "7d": { interval: "7 days", bucketSec: 3600 }, // godzinowo
  "30d": { interval: "30 days", bucketSec: 21600 }, // co 6h
  "90d": { interval: "90 days", bucketSec: 86400 }, // dziennie
  "1y": { interval: "365 days", bucketSec: 604800 }, // tygodniowo
};

app.get("/api/smart-devices/:id/history", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);
  const id = c.req.param("id");
  const range = c.req.query("range") || "30d";
  const cfg = HISTORY_RANGES[range];
  if (!cfg) return c.json({ error: "invalid_range" }, 400);

  const result = await loadDeviceInHousehold(sql, user.id, id);
  if (result.error) return c.json(result.error.body, result.error.status);

  // Zapytania są od siebie niezależne — lecą równolegle (sterownik HTTP Neona,
  // każde to osobny request; sekwencyjnie sumowały się round-tripy).
  const [series, [rangeEnergy], [lastHour], [peak], [priceRow]] =
    await Promise.all([
      // Wykres mocy: średnia/szczyt power_w per bucket (po recorded_at), wyrównany do
      // czasu warszawskiego (granice na czyste lokalne godziny/północe), nie do epoki UTC.
      sql`
      SELECT (to_timestamp(floor(extract(epoch from (recorded_at AT TIME ZONE 'Europe/Warsaw')) / ${cfg.bucketSec}::float8) * ${cfg.bucketSec}::float8)
                AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Warsaw') AS bucket,
             avg(power_w)::float8 AS avg_w,
             max(power_w)::float8 AS max_w
      FROM device_energy_snapshots
      WHERE device_id = ${id} AND power_w IS NOT NULL AND recorded_at >= NOW() - ${cfg.interval}::interval
      GROUP BY bucket
      ORDER BY bucket ASC
    `,
      // Energia z DISTINCT paczek add_ele (po energy_reported_at = event_time z logów),
      // każda raz. Zużycie w wybranym zakresie + w ostatniej godzinie (niezależne od zakresu).
      sql`
      SELECT COALESCE(SUM(energy_kwh), 0)::float8 AS kwh FROM (
        SELECT DISTINCT ON (energy_reported_at) energy_kwh
        FROM device_energy_snapshots
        WHERE device_id = ${id} AND energy_reported_at IS NOT NULL
          AND energy_reported_at >= NOW() - ${cfg.interval}::interval
        ORDER BY energy_reported_at, recorded_at
      ) s
    `,
      sql`
      SELECT COALESCE(SUM(energy_kwh), 0)::float8 AS kwh FROM (
        SELECT DISTINCT ON (energy_reported_at) energy_kwh
        FROM device_energy_snapshots
        WHERE device_id = ${id} AND energy_reported_at IS NOT NULL
          AND energy_reported_at >= NOW() - interval '1 hour'
        ORDER BY energy_reported_at, recorded_at
      ) s
    `,
      sql`
      SELECT max(power_w)::float8 AS peak_w
      FROM device_energy_snapshots
      WHERE device_id = ${id} AND recorded_at >= NOW() - ${cfg.interval}::interval
    `,
      sql`
      SELECT energy_price_pln FROM tuya_credentials WHERE household_id = ${result.row.household_id}
    `,
    ]);
  const pricePln =
    priceRow?.energy_price_pln == null
      ? null
      : Number(priceRow.energy_price_pln);

  const energyKwh = rangeEnergy?.kwh == null ? 0 : Number(rangeEnergy.kwh);
  return c.json({
    range,
    series: series.map((r) => ({
      t: toIso(r.bucket),
      avgW: r.avg_w == null ? null : Number(r.avg_w),
      maxW: r.max_w == null ? null : Number(r.max_w),
    })),
    summary: {
      energyKwh,
      lastHourKwh: lastHour?.kwh == null ? 0 : Number(lastHour.kwh),
      peakW: peak?.peak_w == null ? null : Number(peak.peak_w),
      costPln: pricePln == null ? null : energyKwh * pricePln,
    },
  });
});

// Dane do raportu PDF: zakres dat (max 366 dni, daty warszawskie), opcjonalny
// filtr urządzeń ?deviceIds=a,b (domyślnie wszystkie aktywne). Member+.
const REPORT_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

app.get("/api/smart-devices/report", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);
  const from = c.req.query("from");
  const to = c.req.query("to");
  if (!REPORT_DATE_RE.test(from ?? "") || !REPORT_DATE_RE.test(to ?? "")) {
    return c.json({ error: "from and to must be YYYY-MM-DD" }, 400);
  }
  const spanDays =
    Math.round((Date.parse(to) - Date.parse(from)) / 86400000) + 1;
  if (!(spanDays >= 1 && spanDays <= 366)) {
    return c.json({ error: "range must be 1-366 days, from <= to" }, 400);
  }

  const [membership] = await sql`
    SELECT household_id FROM household_members WHERE user_id = ${user.id}
  `;
  if (!membership) return c.json({ error: "No household" }, 400);

  // Filtr urządzeń — id spoza gospodarstwa po prostu odpadają w WHERE.
  const requestedIds = (c.req.query("deviceIds") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const devices =
    requestedIds.length === 0
      ? await sql`
        SELECT id, display_name FROM smart_devices
        WHERE household_id = ${membership.household_id} AND is_active = true
        ORDER BY created_at ASC
      `
      : await sql`
        SELECT id, display_name FROM smart_devices
        WHERE household_id = ${membership.household_id} AND id = ANY(${requestedIds})
        ORDER BY created_at ASC
      `;
  const ids = devices.map((d) => d.id);
  const [priceRow] = await sql`
    SELECT energy_price_pln FROM tuya_credentials WHERE household_id = ${membership.household_id}
  `;
  const pricePln =
    priceRow?.energy_price_pln == null
      ? null
      : Number(priceRow.energy_price_pln);

  // Granice zakresu: lokalna północ warszawska dnia `from` do północy po dniu `to`.
  const energyRows =
    ids.length === 0
      ? []
      : await sql`
    SELECT device_id, COALESCE(SUM(energy_kwh), 0)::float8 AS kwh FROM (
      SELECT DISTINCT ON (device_id, energy_reported_at) device_id, energy_kwh
      FROM device_energy_snapshots
      WHERE device_id = ANY(${ids}) AND energy_reported_at IS NOT NULL
        AND energy_reported_at >= ${from}::date AT TIME ZONE 'Europe/Warsaw'
        AND energy_reported_at < (${to}::date + 1) AT TIME ZONE 'Europe/Warsaw'
      ORDER BY device_id, energy_reported_at, recorded_at
    ) s GROUP BY device_id
  `;
  const peakRows =
    ids.length === 0
      ? []
      : await sql`
    SELECT device_id, max(power_w)::float8 AS peak_w
    FROM device_energy_snapshots
    WHERE device_id = ANY(${ids})
      AND recorded_at >= ${from}::date AT TIME ZONE 'Europe/Warsaw'
      AND recorded_at < (${to}::date + 1) AT TIME ZONE 'Europe/Warsaw'
    GROUP BY device_id
  `;
  const uptimeRows =
    ids.length === 0
      ? []
      : await sql`
    SELECT device_id, count(*)::int AS on_samples
    FROM device_energy_snapshots
    WHERE device_id = ANY(${ids}) AND energy_reported_at IS NULL
      AND recorded_at >= ${from}::date AT TIME ZONE 'Europe/Warsaw'
      AND recorded_at < (${to}::date + 1) AT TIME ZONE 'Europe/Warsaw'
      AND power_w > 0
    GROUP BY device_id
  `;
  // Zużycie dzienne łącznie (daty warszawskie) — tabela w raporcie.
  const dailyRows =
    ids.length === 0
      ? []
      : await sql`
    SELECT day, COALESCE(SUM(energy_kwh), 0)::float8 AS kwh FROM (
      SELECT DISTINCT ON (device_id, energy_reported_at)
        (energy_reported_at AT TIME ZONE 'Europe/Warsaw')::date AS day, energy_kwh
      FROM device_energy_snapshots
      WHERE device_id = ANY(${ids}) AND energy_reported_at IS NOT NULL
        AND energy_reported_at >= ${from}::date AT TIME ZONE 'Europe/Warsaw'
        AND energy_reported_at < (${to}::date + 1) AT TIME ZONE 'Europe/Warsaw'
      ORDER BY device_id, energy_reported_at, recorded_at
    ) s GROUP BY day ORDER BY day ASC
  `;

  const kwhBy = Object.fromEntries(
    energyRows.map((r) => [r.device_id, Number(r.kwh)]),
  );
  const peakBy = Object.fromEntries(
    peakRows.map((r) => [r.device_id, Number(r.peak_w)]),
  );
  const samplesBy = Object.fromEntries(
    uptimeRows.map((r) => [r.device_id, Number(r.on_samples)]),
  );

  return c.json({
    from,
    to,
    days: spanDays,
    energyPricePln: pricePln,
    devices: devices.map((d) => {
      const kwh = kwhBy[d.id] ?? 0;
      return {
        id: d.id,
        name: d.display_name,
        energyKwh: kwh,
        costPln: pricePln == null ? null : kwh * pricePln,
        peakW: peakBy[d.id] ?? null,
        uptimeMin: (samplesBy[d.id] ?? 0) * SNAPSHOT_INTERVAL_MIN,
      };
    }),
    daily: dailyRows.map((r) => ({
      date:
        typeof r.day === "string"
          ? r.day
          : new Date(r.day).toISOString().slice(0, 10),
      kwh: Number(r.kwh),
    })),
  });
});

// Wysyłka raportu PDF na email zalogowanego usera (załącznik przez Resend).
// PDF generuje frontend; tu tylko walidacja i przekazanie — zawsze na własny adres (anty-spam).
const REPORT_PDF_MAX_BASE64_CHARS = 4 * 1024 * 1024; // ~3 MB PDF

app.post("/api/smart-devices/report/email", authMiddleware, async (c) => {
  const user = c.get("user");

  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }
  const { pdfBase64, from, to } = body ?? {};
  if (typeof pdfBase64 !== "string" || pdfBase64.length === 0) {
    return c.json({ error: "pdfBase64 is required" }, 400);
  }
  if (pdfBase64.length > REPORT_PDF_MAX_BASE64_CHARS)
    return c.json({ error: "pdf_too_large" }, 413);
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(pdfBase64))
    return c.json({ error: "pdfBase64 must be base64" }, 400);
  const period =
    REPORT_DATE_RE.test(from ?? "") && REPORT_DATE_RE.test(to ?? "")
      ? `${from} – ${to}`
      : null;

  const resendKey = getEnv(c, "RESEND_API_KEY");
  if (!resendKey) return c.json({ error: "email_not_configured" }, 503);

  const dateStr = new Date().toISOString().slice(0, 10);
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "HomeCashflow <noreply@homecashflow.org>",
      to: [user.email],
      subject: period ? `Raport energii ${period}` : "Raport energii",
      html: `<p>Cześć${user.name ? ` ${user.name}` : ""}!</p><p>W załączniku raport zużycia energii${period ? ` za okres ${period}` : ""} wygenerowany w HomeCashflow.</p>`,
      attachments: [
        { filename: `raport-energii-${dateStr}.pdf`, content: pdfBase64 },
      ],
    }),
  });
  if (!res.ok) {
    console.error(
      "[report-email] Resend error",
      res.status,
      await res.text().catch(() => ""),
    );
    return c.json({ error: "email_send_failed" }, 502);
  }
  return c.json({ sent: true, to: user.email });
});

app.post("/api/smart-devices", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);

  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }
  if (typeof body?.tuyaDeviceId !== "string" || !body.tuyaDeviceId.trim()) {
    return c.json({ error: "tuyaDeviceId is required" }, 400);
  }
  const tuyaDeviceId = body.tuyaDeviceId.trim();

  const membership = await getMembershipWithOwner(sql, user.id);
  if (!membership) return c.json({ error: "No household" }, 400);
  if (membership.owner_id !== user.id)
    return c.json({ error: "forbidden_owner_only" }, 403);

  // Duplikat (UNIQUE globalnie) — to samo urządzenie w jakimkolwiek gospodarstwie.
  const [dupe] =
    await sql`SELECT 1 FROM smart_devices WHERE tuya_device_id = ${tuyaDeviceId}`;
  if (dupe) return c.json({ error: "device_already_linked" }, 409);

  const ctx = await loadTuyaContext(c, sql, membership.household_id);
  if (!ctx) return c.json({ error: "tuya_not_configured" }, 400);

  let info;
  try {
    info = await getDeviceInfo(ctx, tuyaDeviceId);
  } catch (err) {
    console.error("[smart-devices] getDeviceInfo failed", err);
    return c.json({ error: "device_not_found_in_tuya" }, 404);
  }

  // Snapshot funkcji — best-effort (do renderu kontrolek w Slice 3).
  let functions = null;
  try {
    functions = await getDeviceFunctions(ctx, tuyaDeviceId);
  } catch (err) {
    console.error("[smart-devices] getDeviceFunctions failed (non-fatal)", err);
  }

  const displayName = info?.name || tuyaDeviceId;

  // Urządzenia na podczerwień (pod blasterem Smart IR): nie mają sterowalnych DP ani
  // pomiaru energii — chodzą osobnym API. Wykrywamy po kategorii Tuya (`infrared_*`):
  //  • `infrared_ac` → klima (struktura power/mode/temp/wind) — device_type 'ir_ac',
  //  • reszta (`infrared_tv`, STB, …) → pilot z przyciskami — device_type 'ir_remote'.
  // /functions zwraca dla nich surowe kody pilota, nie standardowe DP — dlatego po kategorii.
  // Rodzic (infrared_id) to gateway_id sub-urządzenia (blaster). Bez rodzica nie da się sterować.
  const category = info?.category ?? "";
  const isIr = category.startsWith("infrared_");
  const isIrAc = category === "infrared_ac";
  const irParentId = isIr ? (info?.gateway_id ?? null) : null;
  if (isIr && !irParentId) {
    return c.json({ error: "ir_parent_missing" }, 400);
  }
  const deviceType = isIrAc ? "ir_ac" : isIr ? "ir_remote" : "plug";

  const [row] = await sql`
    INSERT INTO smart_devices
      (household_id, provider, external_device_id, tuya_device_id, display_name, product_name, product_id,
       device_type, ir_parent_id, functions_json, created_by)
    VALUES
      (${membership.household_id}, 'tuya', ${tuyaDeviceId}, ${tuyaDeviceId}, ${displayName},
       ${info?.product_name ?? null}, ${info?.product_id ?? null},
       ${deviceType}, ${irParentId},
       ${functions == null ? null : JSON.stringify(functions)}, ${user.id})
    RETURNING *
  `;
  return c.json(mapDevice(row), 201);
});

/** Ładuje urządzenie w gospodarstwie usera. 404 gdy nie istnieje, 403 gdy w cudzym. */
async function loadDeviceInHousehold(sql, userId, id) {
  const [row] = await sql`
    SELECT sd.*, h.owner_id AS household_owner_id
    FROM smart_devices sd
    JOIN household_members hm ON hm.household_id = sd.household_id
    JOIN households h ON h.id = sd.household_id
    WHERE sd.id = ${id} AND hm.user_id = ${userId}
  `;
  if (!row) {
    const [exists] = await sql`SELECT 1 FROM smart_devices WHERE id = ${id}`;
    return {
      error: {
        status: exists ? 403 : 404,
        body: { error: exists ? "forbidden" : "not found" },
      },
    };
  }
  return { ok: true, row };
}

app.patch("/api/smart-devices/:id", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);
  const id = c.req.param("id");

  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const result = await loadDeviceInHousehold(sql, user.id, id);
  if (result.error) return c.json(result.error.body, result.error.status);
  if (result.row.household_owner_id !== user.id)
    return c.json({ error: "forbidden_owner_only" }, 403);

  const nextName =
    typeof body.displayName === "string" && body.displayName.trim()
      ? body.displayName.trim()
      : result.row.display_name;
  const nextActive =
    typeof body.isActive === "boolean" ? body.isActive : result.row.is_active;

  // Powiązanie z gniazdkiem: piloty IR (realny stan zestawu z poboru) oraz urządzenia
  // SmartThings (koszt cyklu — pralka ST nie mierzy kWh sama, dane z gniazdka Tuya).
  // Gniazdko musi być w tym samym gospodarstwie i być gniazdkiem. `null` rozłącza.
  let nextPlug = result.row.linked_plug_id;
  if ("linkedPlugId" in body) {
    const canLink =
      IR_TIMER_TYPES.has(result.row.device_type) ||
      result.row.provider === "smartthings";
    if (!canLink) return c.json({ error: "link_not_supported" }, 400);
    if (body.linkedPlugId == null) {
      nextPlug = null;
    } else {
      const [plug] = await sql`
        SELECT id, device_type FROM smart_devices
        WHERE id = ${body.linkedPlugId} AND household_id = ${result.row.household_id}
      `;
      if (!plug) return c.json({ error: "plug_not_found" }, 400);
      if (plug.device_type && plug.device_type !== "plug")
        return c.json({ error: "not_a_plug" }, 400);
      nextPlug = plug.id;
    }
  }

  // Własne nazwy programów pralki: mapa { kodKursu: nazwa }. Sanityzujemy — tylko stringi,
  // przycięte, puste pomijamy (powrót do draftu), limit by nie wpychać śmieci do JSONB.
  let nextCycleLabels = result.row.cycle_labels;
  if ("cycleLabels" in body) {
    const src = body.cycleLabels;
    if (src != null && (typeof src !== "object" || Array.isArray(src))) {
      return c.json({ error: "invalid_cycle_labels" }, 400);
    }
    const clean = {};
    for (const [code, name] of Object.entries(src ?? {}).slice(0, 60)) {
      if (typeof name !== "string") continue;
      const trimmed = name.trim().slice(0, 40);
      if (trimmed) clean[String(code).slice(0, 16)] = trimmed;
    }
    nextCycleLabels = Object.keys(clean).length ? clean : null;
  }

  const [row] = await sql`
    UPDATE smart_devices
    SET display_name = ${nextName}, is_active = ${nextActive},
        linked_plug_id = ${nextPlug},
        cycle_labels = ${nextCycleLabels == null ? null : JSON.stringify(nextCycleLabels)},
        updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return c.json(mapDevice(row));
});

app.delete("/api/smart-devices/:id", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);
  const id = c.req.param("id");

  const result = await loadDeviceInHousehold(sql, user.id, id);
  if (result.error) return c.json(result.error.body, result.error.status);
  if (result.row.household_owner_id !== user.id)
    return c.json({ error: "forbidden_owner_only" }, 403);

  // Usuwamy tylko z naszej DB — w chmurze Tuya urządzenie zostaje.
  await sql`DELETE FROM smart_devices WHERE id = ${id}`;
  return c.body(null, 204);
});

// Sterowanie — member+ (wspólne gospodarstwo). Komendy walidowane względem
// zapisanych funkcji DP przed wysłaniem do Tuya. Audyt w device_command_log.
app.post("/api/smart-devices/:id/commands", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);
  const id = c.req.param("id");

  const result = await loadDeviceInHousehold(sql, user.id, id);
  if (result.error) return c.json(result.error.body, result.error.status);

  // SmartThings: osobny kontrakt (action: start/pauza/stop) + bramka zdalnego sterowania.
  if (result.row.provider === "smartthings") {
    return runStCommand(c, sql, user, result.row);
  }

  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const commands = body?.commands;
  const isIrAc = result.row.device_type === "ir_ac";
  const validationError = isIrAc
    ? validateAcCommands(commands)
    : validateCommands(result.row.functions_json, commands);
  if (validationError)
    return c.json(
      { error: "command_not_allowed", detail: validationError },
      400,
    );

  const ctx = await loadTuyaContext(c, sql, result.row.household_id);
  if (!ctx) return c.json({ error: "tuya_not_configured" }, 400);

  try {
    if (isIrAc) {
      // AC API przyjmuje jedną komendę naraz — wysyłamy po kolei.
      for (const cmd of commands) {
        await sendAcCommand(
          ctx,
          result.row.ir_parent_id,
          result.row.tuya_device_id,
          cmd.code,
          cmd.value,
        );
      }
    } else {
      await sendCommands(ctx, result.row.tuya_device_id, commands);
    }
  } catch (err) {
    console.error("[smart-devices] command failed", err);
    return c.json({ error: "command_failed" }, 502);
  }

  // Audyt po udanym wysłaniu — jeden wpis per komenda. Błąd logu nie wywala akcji.
  for (const cmd of commands) {
    try {
      await sql`
        INSERT INTO device_command_log (household_id, device_id, actor_id, code, value)
        VALUES (${result.row.household_id}, ${result.row.id}, ${user.id}, ${cmd.code}, ${JSON.stringify(cmd.value ?? null)})
      `;
    } catch (err) {
      console.error("[device-command-log] insert failed", err);
    }
  }

  if (isIrAc) {
    const powerCmd = commands.find((cmd) => cmd.code === "power");
    if (powerCmd != null) {
      const v = powerCmd.value;
      const action =
        v === 1 || v === true || v === "1"
          ? "on"
          : v === 0 || v === false || v === "0"
            ? "off"
            : null;
      if (action) {
        notifyHouseholdAcPower(sql, c.env, {
          householdId: result.row.household_id,
          action,
          deviceName: result.row.display_name,
          source: "manual",
        }).catch((err) => console.warn("[push] manual AC notify failed", err));
      }
    }
  }

  return c.json({ ok: true });
});

// Lista przycisków pilota IR (TV/STB/itp.) — do narysowania pilota w UI. Tylko 'ir_remote'.
app.get("/api/smart-devices/:id/ir-keys", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);
  const id = c.req.param("id");

  const result = await loadDeviceInHousehold(sql, user.id, id);
  if (result.error) return c.json(result.error.body, result.error.status);
  if (result.row.device_type !== "ir_remote")
    return c.json({ error: "not_ir_remote" }, 400);

  const ctx = await loadTuyaContext(c, sql, result.row.household_id);
  if (!ctx) return c.json({ error: "tuya_not_configured" }, 400);

  try {
    const r = await getRemoteKeys(
      ctx,
      result.row.ir_parent_id,
      result.row.tuya_device_id,
    );
    return c.json({
      categoryId: r?.category_id ?? null,
      keys: r?.key_list ?? [],
    });
  } catch (err) {
    console.error("[smart-devices] ir-keys failed", err);
    return c.json({ error: "ir_keys_failed" }, 502);
  }
});

// Wysłanie pojedynczego przycisku pilota IR. body: { key, keyId, categoryId } (z listy ir-keys).
app.post("/api/smart-devices/:id/ir-key", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);
  const id = c.req.param("id");

  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const result = await loadDeviceInHousehold(sql, user.id, id);
  if (result.error) return c.json(result.error.body, result.error.status);
  if (result.row.device_type !== "ir_remote")
    return c.json({ error: "not_ir_remote" }, 400);

  const key = typeof body?.key === "string" ? body.key : null;
  const keyId = typeof body?.keyId === "number" ? body.keyId : null;
  const categoryId =
    typeof body?.categoryId === "number" ? body.categoryId : null;
  if (!key && keyId == null) return c.json({ error: "key_required" }, 400);

  const ctx = await loadTuyaContext(c, sql, result.row.household_id);
  if (!ctx) return c.json({ error: "tuya_not_configured" }, 400);

  try {
    await sendRemoteKey(
      ctx,
      result.row.ir_parent_id,
      result.row.tuya_device_id,
      { categoryId, key, keyId },
    );
  } catch (err) {
    console.error("[smart-devices] ir-key failed", err);
    return c.json({ error: "command_failed" }, 502);
  }

  try {
    await sql`
      INSERT INTO device_command_log (household_id, device_id, actor_id, code, value)
      VALUES (${result.row.household_id}, ${result.row.id}, ${user.id}, ${key ?? String(keyId)}, ${JSON.stringify({ keyId, categoryId })})
    `;
  } catch (err) {
    console.error("[device-command-log] insert failed", err);
  }

  return c.json({ ok: true });
});

// Wyłącznik czasowy (tylko urządzenia IR — gniazdka mają natywny DP countdown).
const IR_TIMER_TYPES = new Set(["ir_ac", "ir_remote"]);
const MAX_TIMER_MINUTES = 24 * 60;

// Aktywny timer urządzenia (lub null). Zwraca też ile minut zostało.
app.get("/api/smart-devices/:id/timer", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);
  const id = c.req.param("id");

  const result = await loadDeviceInHousehold(sql, user.id, id);
  if (result.error) return c.json(result.error.body, result.error.status);

  const [t] = await sql`
    SELECT fire_at FROM device_timers
    WHERE device_id = ${id} AND status = 'pending'
    ORDER BY fire_at ASC LIMIT 1
  `;
  if (!t) return c.json({ timer: null });
  const minutesLeft = Math.max(
    0,
    Math.round((new Date(t.fire_at).getTime() - Date.now()) / 60000),
  );
  return c.json({ timer: { fireAt: toIso(t.fire_at), minutesLeft } });
});

// Ustaw/anuluj timer. body: { minutes }. minutes<=0 anuluje. Jeden aktywny per urządzenie.
app.post("/api/smart-devices/:id/timer", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);
  const id = c.req.param("id");

  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const result = await loadDeviceInHousehold(sql, user.id, id);
  if (result.error) return c.json(result.error.body, result.error.status);
  if (!IR_TIMER_TYPES.has(result.row.device_type))
    return c.json({ error: "timer_not_supported" }, 400);

  const minutes = Number(body?.minutes);
  if (!Number.isFinite(minutes))
    return c.json({ error: "minutes_required" }, 400);

  // Zawsze czyścimy poprzedni aktywny timer (partial unique pilnuje jednego pending).
  await sql`UPDATE device_timers SET status = 'canceled' WHERE device_id = ${id} AND status = 'pending'`;

  if (minutes <= 0) return c.json({ timer: null });

  const clamped = Math.min(Math.round(minutes), MAX_TIMER_MINUTES);
  const [t] = await sql`
    INSERT INTO device_timers (device_id, household_id, fire_at, action, created_by)
    VALUES (${id}, ${result.row.household_id}, NOW() + (${clamped} || ' minutes')::interval, 'off', ${user.id})
    RETURNING fire_at
  `;
  return c.json({ timer: { fireAt: toIso(t.fire_at), minutesLeft: clamped } });
});

// ====== Termostat zewnętrzny dla klimy IR (Tuya ir_ac) ======
// Automatyka włącza/wyłącza klimę wg temperatury zewnętrznej (cron co 30 min).
// Minimalna strefa martwa między progami — chroni przed ciągłym przełączaniem.
const THERMOSTAT_MIN_DEADZONE = 1;

function serializeThermostat(t) {
  const num = (v) => (v == null ? null : Number(v));
  return {
    enabled: t.enabled,
    mode: t.climate_mode === "heat" ? "heat" : "cool",
    locationLabel: t.location_label,
    lat: num(t.lat),
    lon: num(t.lon),
    tempOn: num(t.temp_on),
    tempOff: num(t.temp_off),
    lastAction: t.last_action,
    lastCheckAction: t.last_check_action,
    lastOutdoorTemp: num(t.last_outdoor_temp),
    lastCheckedAt: t.last_checked_at ? toIso(t.last_checked_at) : null,
  };
}

// Konfiguracja termostatu urządzenia (lub null).
app.get("/api/smart-devices/:id/thermostat", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);
  const id = c.req.param("id");

  const result = await loadDeviceInHousehold(sql, user.id, id);
  if (result.error) return c.json(result.error.body, result.error.status);

  const [t] = await sql`
    SELECT enabled, climate_mode, location_label, lat, lon, temp_on, temp_off,
           last_action, last_check_action, last_outdoor_temp, last_checked_at
    FROM ac_thermostats WHERE device_id = ${id}
  `;
  if (!t) return c.json({ thermostat: null });
  return c.json({ thermostat: serializeThermostat(t) });
});

// Bieżąca temperatura na zewnątrz dla zapisanej lokalizacji termostatu (na żądanie z UI).
app.get("/api/smart-devices/:id/thermostat/temperature", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);
  const id = c.req.param("id");

  const result = await loadDeviceInHousehold(sql, user.id, id);
  if (result.error) return c.json(result.error.body, result.error.status);

  const [t] = await sql`SELECT lat, lon FROM ac_thermostats WHERE device_id = ${id}`;
  if (!t || t.lat == null || t.lon == null)
    return c.json({ error: "no_location" }, 400);

  try {
    const w = await getOutdoorWeather(
      { lat: Number(t.lat), lon: Number(t.lon) },
      { apiKey: c.env.WEATHER_GOOGLE_API_KEY },
    );
    return c.json({ temp: w?.temp ?? null, condition: w?.condition ?? null });
  } catch (err) {
    console.error("[thermostat] temperature fetch failed", err);
    return c.json({ error: "weather_failed" }, 502);
  }
});

// Zapis konfiguracji (upsert). Tylko klima IR. body: { enabled, locationLabel, lat, lon, tempOn, tempOff }.
app.put("/api/smart-devices/:id/thermostat", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);
  const id = c.req.param("id");

  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const result = await loadDeviceInHousehold(sql, user.id, id);
  if (result.error) return c.json(result.error.body, result.error.status);
  if (result.row.device_type !== "ir_ac")
    return c.json({ error: "thermostat_not_supported" }, 400);

  const tempOn = Number(body?.tempOn);
  const tempOff = Number(body?.tempOff);
  if (!Number.isFinite(tempOn) || !Number.isFinite(tempOff))
    return c.json({ error: "thresholds_required" }, 400);

  const mode = body?.mode === "heat" ? "heat" : "cool";
  if (thermostatThresholdGap(mode, tempOn, tempOff) < THERMOSTAT_MIN_DEADZONE)
    return c.json({ error: "threshold_order" }, 400);

  const enabled = body?.enabled === true;
  let locationLabel =
    typeof body?.locationLabel === "string" ? body.locationLabel.trim() || null : null;
  let lat = body?.lat == null ? null : Number(body.lat);
  let lon = body?.lon == null ? null : Number(body.lon);

  // Geocoding: jeśli podano nazwę miasta, zamieniamy ją raz na lat/lon + etykietę.
  if (typeof body?.city === "string" && body.city.trim()) {
    let geo;
    try {
      geo = await geocodeCity(body.city);
    } catch (err) {
      console.error("[thermostat] geocoding failed", err);
      return c.json({ error: "geocode_failed" }, 502);
    }
    if (!geo) return c.json({ error: "geocode_no_result" }, 400);
    lat = geo.lat;
    lon = geo.lon;
    locationLabel = geo.label;
  }

  if ((lat != null && !Number.isFinite(lat)) || (lon != null && !Number.isFinite(lon)))
    return c.json({ error: "invalid_coordinates" }, 400);

  const [t] = await sql`
    INSERT INTO ac_thermostats
      (device_id, household_id, enabled, climate_mode, location_label, lat, lon, temp_on, temp_off)
    VALUES
      (${id}, ${result.row.household_id}, ${enabled}, ${mode}, ${locationLabel}, ${lat}, ${lon}, ${tempOn}, ${tempOff})
    ON CONFLICT (device_id) DO UPDATE SET
      enabled = EXCLUDED.enabled,
      climate_mode = EXCLUDED.climate_mode,
      location_label = EXCLUDED.location_label,
      lat = EXCLUDED.lat,
      lon = EXCLUDED.lon,
      temp_on = EXCLUDED.temp_on,
      temp_off = EXCLUDED.temp_off,
      updated_at = NOW()
    RETURNING enabled, climate_mode, location_label, lat, lon, temp_on, temp_off,
              last_action, last_check_action, last_outdoor_temp, last_checked_at
  `;
  return c.json({ thermostat: serializeThermostat(t) });
});

// ====== Web Push (powiadomienia o klimie) ======

app.get("/api/push/vapid-public-key", async (c) => {
  const publicKey = c.env.VAPID_PUBLIC_KEY?.trim();
  if (!publicKey) return c.json({ error: "push_not_configured" }, 503);
  return c.json({ publicKey });
});

app.get("/api/push/status", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);
  const [row] = await sql`
    SELECT COUNT(*)::int AS count,
           COALESCE(BOOL_OR(ac_power_notify), false) AS ac_power_notify
    FROM push_subscriptions
    WHERE user_id = ${user.id}
  `;
  const count = row?.count ?? 0;
  return c.json({
    configured: pushConfigured(c.env),
    subscribed: count > 0,
    acPowerNotify: count > 0 ? row.ac_power_notify === true : false,
  });
});

app.post("/api/push/subscribe", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);
  if (!pushConfigured(c.env)) return c.json({ error: "push_not_configured" }, 503);

  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const endpoint = typeof body?.endpoint === "string" ? body.endpoint.trim() : "";
  const p256dh = typeof body?.keys?.p256dh === "string" ? body.keys.p256dh.trim() : "";
  const auth = typeof body?.keys?.auth === "string" ? body.keys.auth.trim() : "";
  if (!endpoint || !p256dh || !auth)
    return c.json({ error: "invalid_subscription" }, 400);

  const acPowerNotify = body?.acPowerNotify !== false;

  await sql`
    INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, ac_power_notify)
    VALUES (${user.id}, ${endpoint}, ${p256dh}, ${auth}, ${acPowerNotify})
    ON CONFLICT (endpoint) DO UPDATE SET
      user_id = EXCLUDED.user_id,
      p256dh = EXCLUDED.p256dh,
      auth = EXCLUDED.auth,
      ac_power_notify = EXCLUDED.ac_power_notify,
      updated_at = NOW()
  `;

  return c.json({ ok: true, acPowerNotify });
});

app.delete("/api/push/subscribe", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);

  let endpoint = null;
  try {
    const body = await c.req.json();
    endpoint = typeof body?.endpoint === "string" ? body.endpoint.trim() : null;
  } catch {
    /* brak body — usuń wszystkie subskrypcje usera */
  }

  if (endpoint) {
    await sql`
      DELETE FROM push_subscriptions
      WHERE user_id = ${user.id} AND endpoint = ${endpoint}
    `;
  } else {
    await sql`DELETE FROM push_subscriptions WHERE user_id = ${user.id}`;
  }

  return c.json({ ok: true });
});

app.put("/api/push/preferences", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);

  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  if (typeof body?.acPowerNotify !== "boolean")
    return c.json({ error: "ac_power_notify_required" }, 400);

  await sql`
    UPDATE push_subscriptions
    SET ac_power_notify = ${body.acPowerNotify}, updated_at = NOW()
    WHERE user_id = ${user.id}
  `;

  return c.json({ ok: true, acPowerNotify: body.acPowerNotify });
});

// ============ ACTION LOG (undo Phase 4) ============

app.get("/api/action-log", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);

  const [membership] = await sql`
    SELECT household_id FROM household_members WHERE user_id = ${user.id}
  `;
  if (!membership) return c.json({ entries: [] });

  const rawKey = getFinanceDataKey(c);
  const rows = await sql`
    SELECT al.id, al.actor_id, al.at, al.operation, al.resource_type, al.resource_id,
           al.before, al.after, al.undone_at, al.undone_by, al.undoes_entry_id,
           u.name AS actor_name, u.email AS actor_email,
           u2.name AS undone_by_name
    FROM action_log al
    LEFT JOIN users u ON u.id = al.actor_id
    LEFT JOIN users u2 ON u2.id = al.undone_by
    WHERE al.household_id = ${membership.household_id}
    ORDER BY al.at DESC, al.id DESC
    LIMIT 20
  `;

  const parseSnapshot = (raw) => {
    if (raw == null) return {};
    if (typeof raw === "object") return raw;
    if (typeof raw === "string") {
      try {
        return JSON.parse(raw);
      } catch {
        return {};
      }
    }
    return {};
  };

  const entries = [];
  for (const r of rows) {
    // Z `after`/`before` wyciągamy "label" — name/type — odszyfrowany żeby UI mógł go pokazać.
    const snapshotForLabel = parseSnapshot(r.after ?? r.before);
    let label = null;
    if (snapshotForLabel.name) {
      try {
        label = await decryptField(snapshotForLabel.name, rawKey);
      } catch {
        label = null;
      }
    }
    let amount = null;
    if (snapshotForLabel.amount != null) {
      try {
        amount = Number(await decryptField(snapshotForLabel.amount, rawKey));
      } catch {
        amount = null;
      }
    }
    if (amount == null && snapshotForLabel.monthly_limit != null) {
      try {
        amount = Number(
          await decryptField(snapshotForLabel.monthly_limit, rawKey),
        );
      } catch {
        amount = null;
      }
    }
    const txnKind =
      r.resource_type === "transaction" && snapshotForLabel.kind
        ? String(snapshotForLabel.kind)
        : null;
    const monthRaw = snapshotForLabel.month;
    const monthNum =
      monthRaw != null && monthRaw !== "" ? Number(monthRaw) : NaN;
    const month =
      r.resource_type === "transaction" &&
      Number.isInteger(monthNum) &&
      monthNum >= 0 &&
      monthNum <= 11
        ? monthNum
        : null;
    entries.push({
      id: r.id,
      at: r.at instanceof Date ? r.at.toISOString() : String(r.at),
      operation: r.operation,
      resourceType: r.resource_type,
      resourceId: r.resource_id,
      actorId: r.actor_id,
      actorName: r.actor_name ?? r.actor_email ?? null,
      undoneAt:
        r.undone_at == null
          ? null
          : r.undone_at instanceof Date
            ? r.undone_at.toISOString()
            : String(r.undone_at),
      undoneBy: r.undone_by ?? null,
      undoneByName: r.undone_by_name ?? null,
      undoesEntryId: r.undoes_entry_id ?? null,
      label,
      amount,
      txnKind,
      month,
    });
  }

  return c.json({ entries });
});

/**
 * POST /api/action-log/:id/undo — odwrotna operacja do wpisu z action_log.
 *
 * Reverse:
 *   CREATE  → DELETE z tabeli docelowej (jeśli istnieje)
 *   UPDATE  → UPDATE wartościami z `before`
 *   DELETE  → INSERT z `before` (z tym samym id jeśli nie ma konfliktu)
 *
 * Idempotencja:
 *   - jeśli wpis już cofnięty (undone_at != null) → 200 { alreadyUndone: true }
 *   - jeśli zasób nie istnieje a operacja to CREATE/UPDATE → 200 z notyfikacją
 *
 * Permissions: każdy member household widzi wpisy; cofać może
 *   - wpisy własne (actor_id == user.id)
 *   - dowolne, jeśli jest ownerem household
 */
app.post("/api/action-log/:id/undo", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);
  const id = c.req.param("id");

  const [entry] = await sql`
    SELECT al.*, h.owner_id
    FROM action_log al
    JOIN households h ON h.id = al.household_id
    WHERE al.id = ${id}
  `;
  if (!entry) return c.json({ error: "not found" }, 404);

  // Membership w household tego wpisu
  const [membership] = await sql`
    SELECT 1 FROM household_members WHERE household_id = ${entry.household_id} AND user_id = ${user.id}
  `;
  if (!membership) return c.json({ error: "forbidden" }, 403);

  // Permissions: owner może cofać cudze; member tylko swoje
  const isOwner = entry.owner_id === user.id;
  const isOwnEntry = entry.actor_id === user.id;
  if (!isOwner && !isOwnEntry) {
    return c.json({ error: "forbidden" }, 403);
  }

  // Idempotencja: już cofnięte
  if (entry.undone_at != null) {
    return c.json({
      ok: true,
      alreadyUndone: true,
      notice: "Akcja była już cofnięta",
    });
  }
  // Nie cofamy wpisów typu UNDO
  if (entry.operation === "UNDO") {
    return c.json({ error: "Cannot undo an undo entry" }, 400);
  }
  // Okno czasowe: 1h od `at`. Po wygaśnięciu wpis zostaje w logu (audit),
  // ale juz go nie cofniesz — chroni przed "odkopaniem" starej zmiany.
  const entryAtMs =
    entry.at instanceof Date
      ? entry.at.getTime()
      : new Date(entry.at).getTime();
  if (Number.isFinite(entryAtMs) && Date.now() - entryAtMs > UNDO_WINDOW_MS) {
    return c.json(
      { error: "undo_window_expired", notice: "Okno cofania (24h) wygasło" },
      400,
    );
  }

  const before = entry.before; // jsonb deserializowany przez Neon
  const after = entry.after;
  const rt = entry.resource_type;
  const op = entry.operation;
  const resourceId = entry.resource_id;
  let notice = null;

  try {
    if (op === "CREATE") {
      const deleted = await applyCreateRevert(
        sql,
        rt,
        entry.household_id,
        resourceId,
      );
      if (!deleted)
        notice = "Zasób już nie istniał — wpis oznaczony jako cofnięty.";
    } else if (op === "UPDATE") {
      if (!before)
        return c.json(
          { error: "Cannot undo UPDATE without 'before' snapshot" },
          500,
        );
      await applyUpdateRevert(sql, rt, entry.household_id, resourceId, before);
    } else if (op === "DELETE") {
      if (!before)
        return c.json(
          { error: "Cannot undo DELETE without 'before' snapshot" },
          500,
        );
      await applyDeleteRevert(sql, rt, entry.household_id, before);
    } else {
      return c.json({ error: `Unsupported operation: ${op}` }, 400);
    }
  } catch (err) {
    console.error("[undo] reverse op failed", err);
    return c.json({ error: "Undo failed", detail: err.message }, 500);
  }

  // Mark original + insert UNDO entry
  await sql`
    UPDATE action_log SET undone_at = NOW(), undone_by = ${user.id} WHERE id = ${id}
  `;
  await safeLogAction(sql, {
    householdId: entry.household_id,
    actorId: user.id,
    operation: "UNDO",
    resourceType: rt,
    resourceId,
    before: after,
    after: before,
    undoesEntryId: id,
  });

  return c.json({ ok: true, ...(notice ? { notice } : {}) });
});

// Helpery do undo — wybierane statycznie, bo Neon SQL nie pozwala bindować nazwy tabeli.

async function applyCreateRevert(sql, rt, householdId, resourceId) {
  if (rt === "savings_goal") {
    await sql`DELETE FROM savings_goals WHERE household_id = ${householdId}`;
    return true;
  }
  if (rt === "transaction") {
    const [exists] =
      await sql`SELECT 1 FROM transactions WHERE id = ${resourceId}`;
    if (!exists) return false;
    await sql`DELETE FROM transactions WHERE id = ${resourceId}`;
    return true;
  }
  if (rt === "savings_account") {
    const [exists] =
      await sql`SELECT 1 FROM savings_accounts WHERE id = ${resourceId}`;
    if (!exists) return false;
    await sql`DELETE FROM savings_accounts WHERE id = ${resourceId}`;
    return true;
  }
  if (rt === "category_budget") {
    const [exists] =
      await sql`SELECT 1 FROM category_budgets WHERE id = ${resourceId}`;
    if (!exists) return false;
    await sql`DELETE FROM category_budgets WHERE id = ${resourceId}`;
    return true;
  }
  throw new Error(`CREATE revert not implemented for ${rt}`);
}

async function applyUpdateRevert(sql, rt, householdId, resourceId, before) {
  if (rt === "transaction") {
    const [exists] =
      await sql`SELECT 1 FROM transactions WHERE id = ${resourceId}`;
    if (!exists) return; // no-op
    await sql`
      UPDATE transactions
      SET kind = ${before.kind},
          name = ${before.name},
          amount = ${before.amount},
          txn_date = ${before.txn_date},
          year = ${before.year},
          month = ${before.month},
          is_fixed = ${before.is_fixed},
          category = ${before.category ?? null},
          updated_at = NOW()
      WHERE id = ${resourceId}
    `;
  } else if (rt === "savings_account") {
    const [exists] =
      await sql`SELECT 1 FROM savings_accounts WHERE id = ${resourceId}`;
    if (!exists) return;
    await sql`
      UPDATE savings_accounts
      SET name = ${before.name}, amount = ${before.amount}, icon = ${before.icon ?? null}, updated_at = NOW()
      WHERE id = ${resourceId}
    `;
  } else if (rt === "category_budget") {
    const [exists] =
      await sql`SELECT 1 FROM category_budgets WHERE id = ${resourceId}`;
    if (!exists) return;
    await sql`
      UPDATE category_budgets
      SET name = ${before.name}, monthly_limit = ${before.monthly_limit}, updated_at = NOW()
      WHERE id = ${resourceId}
    `;
  } else if (rt === "savings_goal") {
    // singleton upsert wstecz
    await sql`
      INSERT INTO savings_goals (household_id, type, monthly_amount, yearly_amount, target_month, updated_at)
      VALUES (${householdId}, ${before.type}, ${before.monthly_amount}, ${before.yearly_amount}, ${before.target_month}, NOW())
      ON CONFLICT (household_id) DO UPDATE SET
        type = EXCLUDED.type, monthly_amount = EXCLUDED.monthly_amount,
        yearly_amount = EXCLUDED.yearly_amount, target_month = EXCLUDED.target_month,
        updated_at = NOW()
    `;
  } else {
    throw new Error(`UPDATE revert not implemented for ${rt}`);
  }
}

async function applyDeleteRevert(sql, rt, householdId, before) {
  // Spróbuj z tym samym id; jeśli już zajęte przez inny rekord → insert bez id (auto-gen).
  if (rt === "transaction") {
    const [exists] =
      await sql`SELECT 1 FROM transactions WHERE id = ${before.id}`;
    if (!exists) {
      await sql`
        INSERT INTO transactions (id, household_id, kind, name, amount, txn_date, year, month, is_fixed, category, created_by)
        VALUES (${before.id}, ${householdId}, ${before.kind}, ${before.name}, ${before.amount}, ${before.txn_date},
                ${before.year}, ${before.month}, ${before.is_fixed}, ${before.category ?? null}, ${before.created_by ?? null})
      `;
    } else {
      await sql`
        INSERT INTO transactions (household_id, kind, name, amount, txn_date, year, month, is_fixed, category, created_by)
        VALUES (${householdId}, ${before.kind}, ${before.name}, ${before.amount}, ${before.txn_date},
                ${before.year}, ${before.month}, ${before.is_fixed}, ${before.category ?? null}, ${before.created_by ?? null})
      `;
    }
  } else if (rt === "savings_account") {
    const [exists] =
      await sql`SELECT 1 FROM savings_accounts WHERE id = ${before.id}`;
    if (!exists) {
      await sql`INSERT INTO savings_accounts (id, household_id, name, amount, icon) VALUES (${before.id}, ${householdId}, ${before.name}, ${before.amount}, ${before.icon ?? null})`;
    } else {
      await sql`INSERT INTO savings_accounts (household_id, name, amount, icon) VALUES (${householdId}, ${before.name}, ${before.amount}, ${before.icon ?? null})`;
    }
  } else if (rt === "category_budget") {
    const [exists] =
      await sql`SELECT 1 FROM category_budgets WHERE id = ${before.id}`;
    if (!exists) {
      await sql`INSERT INTO category_budgets (id, household_id, name, monthly_limit) VALUES (${before.id}, ${householdId}, ${before.name}, ${before.monthly_limit})`;
    } else {
      await sql`INSERT INTO category_budgets (household_id, name, monthly_limit) VALUES (${householdId}, ${before.name}, ${before.monthly_limit})`;
    }
  } else if (rt === "savings_goal") {
    // singleton — nie ma DELETE w UI, ale na wszelki wypadek
    await sql`
      INSERT INTO savings_goals (household_id, type, monthly_amount, yearly_amount, target_month)
      VALUES (${householdId}, ${before.type}, ${before.monthly_amount}, ${before.yearly_amount}, ${before.target_month})
      ON CONFLICT (household_id) DO UPDATE SET
        type = EXCLUDED.type, monthly_amount = EXCLUDED.monthly_amount,
        yearly_amount = EXCLUDED.yearly_amount, target_month = EXCLUDED.target_month, updated_at = NOW()
    `;
  } else {
    throw new Error(`DELETE revert not implemented for ${rt}`);
  }
}

// ============ HOUSEHOLD ENDPOINTS ============

app.get("/api/household", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);

  const [membership] = await sql`
    SELECT household_id FROM household_members WHERE user_id = ${user.id}
  `;
  if (!membership) {
    return c.json({ error: "No household" }, 400);
  }

  const [household] = await sql`
    SELECT id, name, owner_id, created_at FROM households WHERE id = ${membership.household_id}
  `;

  const members = await sql`
    SELECT u.id, u.email, u.name, u.avatar_url, hm.joined_at
    FROM household_members hm
    JOIN users u ON u.id = hm.user_id
    WHERE hm.household_id = ${household.id}
    ORDER BY hm.joined_at
  `;

  const pendingInvitations = await sql`
    SELECT id, email, created_at FROM invitations
    WHERE household_id = ${household.id} AND status = 'pending'
  `;

  return c.json({
    household,
    members,
    pendingInvitations,
    isOwner: household.owner_id === user.id,
  });
});

app.patch("/api/household", authMiddleware, async (c) => {
  const user = c.get("user");
  const { name } = await c.req.json();
  const sql = getDb(c);

  if (!name || !name.trim()) {
    return c.json({ error: "Nazwa jest wymagana" }, 400);
  }

  const [membership] = await sql`
    SELECT household_id FROM household_members WHERE user_id = ${user.id}
  `;
  if (!membership) return c.json({ error: "No household" }, 400);

  const [household] = await sql`
    SELECT owner_id FROM households WHERE id = ${membership.household_id}
  `;
  if (household.owner_id !== user.id) {
    return c.json({ error: "Tylko właściciel może zmienić nazwę" }, 403);
  }

  await sql`
    UPDATE households SET name = ${name.trim()} WHERE id = ${membership.household_id}
  `;

  return c.json({ ok: true });
});

app.post("/api/household/invite", authMiddleware, async (c) => {
  const user = c.get("user");
  const { email } = await c.req.json();
  const sql = getDb(c);

  // Check ownership
  const [household] = await sql`
    SELECT h.id FROM households h
    JOIN household_members hm ON hm.household_id = h.id
    WHERE hm.user_id = ${user.id} AND h.owner_id = ${user.id}
  `;
  if (!household) {
    return c.json({ error: "Only owner can invite" }, 403);
  }

  // Generate token
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const [invitation] = await sql`
    INSERT INTO invitations (household_id, email, invited_by, token, expires_at)
    VALUES (${household.id}, ${email}, ${user.id}, ${token}, ${expiresAt.toISOString()})
    RETURNING id, email, token, expires_at, created_at
  `;

  // Wyślij email z zaproszeniem przez Resend
  const resendKey = getEnv(c, "RESEND_API_KEY");
  const frontendUrl = getEnv(c, "FRONTEND_URL") || "http://localhost:5173";
  const inviteLink = `${frontendUrl}?invite=${token}`;

  if (resendKey) {
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "HomeCashflow <noreply@homecashflow.org>",
          to: [email],
          subject: `${user.name || user.email} zaprasza Cię do wspólnego gospodarstwa`,
          html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a; padding: 40px 20px;">
    <tr><td align="center">
      <table width="500" cellpadding="0" cellspacing="0" style="max-width: 500px; width: 100%;">
        <!-- Logo -->
        <tr><td align="center" style="padding-bottom: 32px;">
          <table cellpadding="0" cellspacing="0"><tr>
            <td style="background: linear-gradient(135deg, #6366f1, #9333ea); padding: 12px; border-radius: 16px;">
              <span style="font-size: 24px; color: white;">⚡</span>
            </td>
            <td style="padding-left: 12px;">
              <span style="font-size: 22px; font-weight: bold; color: white;">HomeCashflow</span>
            </td>
          </tr></table>
        </td></tr>
        <!-- Card -->
        <tr><td style="background-color: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 40px 32px;">
          <h1 style="margin: 0 0 8px; font-size: 24px; color: white; text-align: center;">Zaproszenie do gospodarstwa</h1>
          <p style="margin: 0 0 24px; color: #94a3b8; text-align: center; font-size: 15px;">Wspólne zarządzanie budżetem domowym</p>
          <div style="background-color: #0f172a; border: 1px solid #334155; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <p style="margin: 0 0 4px; color: #94a3b8; font-size: 13px;">Zaprasza:</p>
            <p style="margin: 0; color: white; font-size: 16px; font-weight: 600;">${user.name || user.email}</p>
          </div>
          <p style="color: #cbd5e1; font-size: 15px; line-height: 1.6; margin: 0 0 28px;">
            Zostałeś zaproszony do wspólnego gospodarstwa domowego. Dołącz, aby razem śledzić przychody, wydatki i oszczędności.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
            <a href="${inviteLink}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px;">Dołącz do gospodarstwa</a>
          </td></tr></table>
          <div style="margin-top: 28px; padding-top: 20px; border-top: 1px solid #334155;">
            <p style="margin: 0 0 8px; color: #64748b; font-size: 13px;">⚠️ Zaloguj się kontem Google z adresem:</p>
            <p style="margin: 0; color: #818cf8; font-size: 14px; font-weight: 500;">${email}</p>
            <p style="margin: 8px 0 0; color: #475569; font-size: 12px;">Link ważny 7 dni</p>
          </div>
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding-top: 24px; text-align: center;">
          <p style="margin: 0; color: #475569; font-size: 12px;">HomeCashflow — zarządzaj finansami inteligentnie</p>
          <p style="margin: 4px 0 0; color: #334155; font-size: 11px;">Ten email został wysłany automatycznie. Nie odpowiadaj na niego.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
          `,
        }),
      });
    } catch (err) {
      console.error("Resend error:", err);
      // Nie blokujemy — zaproszenie i tak jest w bazie, link dostępny w UI
    }
  }

  return c.json({ invitation });
});

app.post("/api/household/invite/:token/accept", authMiddleware, async (c) => {
  const user = c.get("user");
  const inviteToken = c.req.param("token");
  const sql = getDb(c);

  // Find invitation
  const [invitation] = await sql`
    SELECT * FROM invitations
    WHERE token = ${inviteToken} AND status = 'pending' AND expires_at > NOW()
  `;
  if (!invitation) {
    return c.json({ error: "Invalid or expired invitation" }, 404);
  }

  // Check email matches
  if (invitation.email !== user.email) {
    return c.json({ error: "Email does not match invitation" }, 403);
  }

  // Remove user from their current household
  const [currentMembership] = await sql`
    SELECT household_id FROM household_members WHERE user_id = ${user.id}
  `;
  if (currentMembership) {
    const [currentHousehold] = await sql`
      SELECT id, owner_id FROM households WHERE id = ${currentMembership.household_id}
    `;
    // Only clean up if user owns this household and is the only member
    if (currentHousehold && currentHousehold.owner_id === user.id) {
      const memberCount = await sql`
        SELECT count(*) as cnt FROM household_members WHERE household_id = ${currentHousehold.id}
      `;
      if (parseInt(memberCount[0].cnt) === 1) {
        await sql`DELETE FROM finance_data WHERE household_id = ${currentHousehold.id}`;
        await sql`DELETE FROM household_members WHERE household_id = ${currentHousehold.id}`;
        await sql`DELETE FROM households WHERE id = ${currentHousehold.id}`;
      }
    } else {
      await sql`DELETE FROM household_members WHERE user_id = ${user.id} AND household_id = ${currentMembership.household_id}`;
    }
  }

  // Add to invited household
  await sql`
    INSERT INTO household_members (household_id, user_id)
    VALUES (${invitation.household_id}, ${user.id})
    ON CONFLICT DO NOTHING
  `;

  // Mark invitation as accepted
  await sql`
    UPDATE invitations SET status = 'accepted' WHERE id = ${invitation.id}
  `;

  return c.json({ ok: true });
});

// Helper: create a fresh household for a user
async function createFreshHousehold(sql, userId) {
  const [household] = await sql`
    INSERT INTO households (owner_id) VALUES (${userId}) RETURNING *
  `;
  await sql`
    INSERT INTO household_members (household_id, user_id) VALUES (${household.id}, ${userId})
  `;
  await sql`
    INSERT INTO finance_data (household_id) VALUES (${household.id})
  `;
  return household;
}

app.delete("/api/household/members/:userId", authMiddleware, async (c) => {
  const user = c.get("user");
  const targetUserId = c.req.param("userId");
  const sql = getDb(c);

  if (targetUserId === user.id) {
    return c.json({ error: "Cannot remove yourself" }, 400);
  }

  const [household] = await sql`
    SELECT h.id, h.owner_id FROM households h
    JOIN household_members hm ON hm.household_id = h.id
    WHERE hm.user_id = ${user.id} AND h.owner_id = ${user.id}
  `;
  if (!household) {
    return c.json({ error: "Only owner can remove members" }, 403);
  }

  await sql`
    DELETE FROM household_members WHERE user_id = ${targetUserId} AND household_id = ${household.id}
  `;
  await createFreshHousehold(sql, targetUserId);

  return c.json({ ok: true });
});

app.post("/api/household/leave", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);

  const [membership] = await sql`
    SELECT hm.household_id, h.owner_id FROM household_members hm
    JOIN households h ON h.id = hm.household_id
    WHERE hm.user_id = ${user.id}
  `;
  if (!membership) {
    return c.json({ error: "No household" }, 400);
  }

  if (membership.owner_id === user.id) {
    return c.json({ error: "Owner cannot leave" }, 400);
  }

  await sql`
    DELETE FROM household_members WHERE user_id = ${user.id} AND household_id = ${membership.household_id}
  `;
  await createFreshHousehold(sql, user.id);

  return c.json({ ok: true });
});

app.delete("/api/household", authMiddleware, async (c) => {
  const user = c.get("user");
  const sql = getDb(c);

  const [household] = await sql`
    SELECT h.id, h.owner_id FROM households h
    JOIN household_members hm ON hm.household_id = h.id
    WHERE hm.user_id = ${user.id}
  `;
  if (!household || household.owner_id !== user.id) {
    return c.json({ error: "Only owner can delete household" }, 403);
  }

  const members = await sql`
    SELECT user_id FROM household_members WHERE household_id = ${household.id}
  `;

  await sql`DELETE FROM households WHERE id = ${household.id}`;

  for (const member of members) {
    await createFreshHousehold(sql, member.user_id);
  }

  return c.json({ ok: true });
});
