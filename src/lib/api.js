const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const getApiUrl = () => API_URL;

export const fetchFinanceData = async () => {
  const response = await fetch(`${API_URL}/api/finance`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Nie udało się pobrać danych finansowych z API.');
  }

  return response.json();
};

export const saveFinanceDataOnServer = async (data) => {
  const response = await fetch(`${API_URL}/api/finance`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({ data })
  });

  if (!response.ok) {
    throw new Error('Nie udało się zapisać danych finansowych w API.');
  }

  return response.json();
};

// ===== Per-row endpointy: transactions (Phase 1) =====

export class ConflictError extends Error {
  constructor(current) {
    super('Conflict');
    this.name = 'ConflictError';
    this.current = current;
  }
}

export const createTransaction = async (body) => {
  const res = await fetch(`${API_URL}/api/transactions`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.error || `POST /api/transactions: ${res.status}`);
  }
  return res.json();
};

export const patchTransaction = async (id, updatedAt, changes) => {
  const res = await fetch(`${API_URL}/api/transactions/${id}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'If-Match': updatedAt,
    },
    body: JSON.stringify(changes),
  });
  if (res.status === 409) {
    const body = await res.json();
    throw new ConflictError(body.current);
  }
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.error || `PATCH /api/transactions/${id}: ${res.status}`);
  }
  return res.json();
};

export const deleteTransaction = async (id, updatedAt) => {
  const res = await fetch(`${API_URL}/api/transactions/${id}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'If-Match': updatedAt },
  });
  if (res.status === 409) {
    throw new ConflictError(null);
  }
  if (!res.ok && res.status !== 204) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.error || `DELETE /api/transactions/${id}: ${res.status}`);
  }
};

// ===== Per-row endpointy: savings_accounts, category_budgets, savings_goal (Phase 3) =====

const mutateWithMatch = async (url, method, ifMatch, body) => {
  const res = await fetch(`${API_URL}${url}`, {
    method,
    credentials: 'include',
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json', Accept: 'application/json' } : {}),
      ...(ifMatch ? { 'If-Match': ifMatch } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  if (res.status === 409) {
    const data = await res.json().catch(() => ({}));
    throw new ConflictError(data.current ?? null);
  }
  if (!res.ok && res.status !== 204) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.error || `${method} ${url}: ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
};

export const createSavingsAccount = (body) =>
  mutateWithMatch('/api/savings-accounts', 'POST', null, body);
export const patchSavingsAccount = (id, updatedAt, changes) =>
  mutateWithMatch(`/api/savings-accounts/${id}`, 'PATCH', updatedAt, changes);
export const deleteSavingsAccount = (id, updatedAt) =>
  mutateWithMatch(`/api/savings-accounts/${id}`, 'DELETE', updatedAt);

export const createCategoryBudget = (body) =>
  mutateWithMatch('/api/category-budgets', 'POST', null, body);
export const patchCategoryBudget = (id, updatedAt, changes) =>
  mutateWithMatch(`/api/category-budgets/${id}`, 'PATCH', updatedAt, changes);
export const deleteCategoryBudget = (id, updatedAt) =>
  mutateWithMatch(`/api/category-budgets/${id}`, 'DELETE', updatedAt);

export const putSavingsGoal = (body) =>
  mutateWithMatch('/api/savings-goal', 'PUT', null, body);

// ===== Action log + undo (Phase 4) =====

export const fetchActionLog = async () => {
  const res = await fetch(`${API_URL}/api/action-log`, {
    method: 'GET',
    credentials: 'include',
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`GET /api/action-log: ${res.status}`);
  const body = await res.json();
  return Array.isArray(body.entries) ? body.entries : [];
};

export const undoActionLogEntry = async (id) => {
  const res = await fetch(`${API_URL}/api/action-log/${id}/undo`, {
    method: 'POST',
    credentials: 'include',
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.error || `POST /api/action-log/${id}/undo: ${res.status}`);
  }
  return res.json();
};

// ===== Integracja Tuya (Slice 1) =====

/** GET status integracji. 403 → user nie jest ownerem (rzuca z .status). */
export const fetchTuyaCredentials = async () => {
  const res = await fetch(`${API_URL}/api/tuya/credentials`, {
    method: 'GET',
    credentials: 'include',
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    const err = new Error(`GET /api/tuya/credentials: ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
};

/** PUT poświadczeń — backend weryfikuje tokenem przed zapisem. */
export const saveTuyaCredentials = async (body) => {
  const res = await fetch(`${API_URL}/api/tuya/credentials`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `PUT /api/tuya/credentials: ${res.status}`);
    err.code = data.error;
    err.status = res.status;
    throw err;
  }
  return data;
};

/** PATCH ceny 1 kWh (zł) — bez ponownego wpisywania poświadczeń. */
export const saveTuyaEnergyPrice = async (energyPricePln) => {
  const res = await fetch(`${API_URL}/api/tuya/credentials`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ energyPricePln }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `PATCH /api/tuya/credentials: ${res.status}`);
    err.code = data.error;
    err.status = res.status;
    throw err;
  }
  return data;
};

export const deleteTuyaCredentials = async () => {
  const res = await fetch(`${API_URL}/api/tuya/credentials`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok && res.status !== 204) {
    throw new Error(`DELETE /api/tuya/credentials: ${res.status}`);
  }
  return true;
};

// ===== Urządzenia Tuya (Slice 2) =====

const jsonOrThrow = async (res, label) => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `${label}: ${res.status}`);
    err.code = data.error;
    err.status = res.status;
    throw err;
  }
  return data;
};

export const fetchSmartDevices = async () => {
  const res = await fetch(`${API_URL}/api/smart-devices`, {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  });
  const data = await jsonOrThrow(res, 'GET /api/smart-devices');
  return Array.isArray(data.devices) ? data.devices : [];
};

export const fetchSmartDevicesStatus = async () => {
  const res = await fetch(`${API_URL}/api/smart-devices/status`, {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  });
  const data = await jsonOrThrow(res, 'GET /api/smart-devices/status');
  return Array.isArray(data.statuses) ? data.statuses : [];
};

export const discoverSmartDevices = async () => {
  const res = await fetch(`${API_URL}/api/smart-devices/discover`, {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  });
  const data = await jsonOrThrow(res, 'GET /api/smart-devices/discover');
  return Array.isArray(data.devices) ? data.devices : [];
};

export const addSmartDevice = async (tuyaDeviceId) => {
  const res = await fetch(`${API_URL}/api/smart-devices`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ tuyaDeviceId }),
  });
  return jsonOrThrow(res, 'POST /api/smart-devices');
};

export const patchSmartDevice = async (id, body) => {
  const res = await fetch(`${API_URL}/api/smart-devices/${id}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });
  return jsonOrThrow(res, 'PATCH /api/smart-devices');
};

export const deleteSmartDevice = async (id) => {
  const res = await fetch(`${API_URL}/api/smart-devices/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok && res.status !== 204) {
    throw new Error(`DELETE /api/smart-devices/${id}: ${res.status}`);
  }
  return true;
};

export const sendDeviceCommands = async (id, commands) => {
  const res = await fetch(`${API_URL}/api/smart-devices/${id}/commands`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ commands }),
  });
  return jsonOrThrow(res, 'POST /api/smart-devices/commands');
};

export const fetchDeviceHistory = async (id, range) => {
  const res = await fetch(`${API_URL}/api/smart-devices/${id}/history?range=${range}`, {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  });
  return jsonOrThrow(res, 'GET /api/smart-devices/history');
};
