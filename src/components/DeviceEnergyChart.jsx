import { useState, useEffect, useCallback, useRef } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Loader2, Zap, Activity, Banknote } from "lucide-react";
import { fetchDeviceHistory } from "../lib/api";
import { usePolling } from "../hooks/usePolling";

const RANGES = [
  { key: "1d", label: "24h" },
  { key: "7d", label: "7 dni" },
  { key: "30d", label: "30 dni" },
  { key: "90d", label: "90 dni" },
  { key: "1y", label: "1 rok" },
];

// Pomiary zapisywane w UTC — wyświetlamy zawsze w czasie warszawskim.
const TZ = "Europe/Warsaw";

function formatTick(iso, range) {
  const d = new Date(iso);
  if (range === "1d") {
    return d.toLocaleTimeString("pl-PL", {
      timeZone: TZ,
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  if (range === "7d") {
    return d.toLocaleString("pl-PL", {
      timeZone: TZ,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return d.toLocaleDateString("pl-PL", {
    timeZone: TZ,
    day: "2-digit",
    month: "2-digit",
  });
}

// Zakres pamiętany per urządzenie — każde może mieć inny wybrany okres.
const rangeStorageKey = (deviceId) => `deviceChartRange:${deviceId}`;

const loadSavedRange = (deviceId) => {
  try {
    const saved = localStorage.getItem(rangeStorageKey(deviceId));
    return RANGES.some((r) => r.key === saved) ? saved : "30d";
  } catch {
    return "30d";
  }
};

// Małe zużycie (np. 0.021) potrzebuje 3 miejsc; przy większych 2 wystarczą.
const fmtKwh = (v) => {
  const n = v ?? 0;
  return n !== 0 && Math.abs(n) < 1 ? n.toFixed(3) : n.toFixed(2);
};

// Mobile: zawsze max 3 cyfry łącznie, żeby kafelek się mieścił (0.92, 11.1, 123).
const fmtKwhMobile = (v) => {
  const n = v ?? 0;
  if (Math.abs(n) >= 100) return n.toFixed(0);
  if (Math.abs(n) >= 10) return n.toFixed(1);
  return n.toFixed(2);
};

export const DeviceEnergyChart = ({ deviceId, refreshKey = 0 }) => {
  const [range, setRange] = useState(() => loadSavedRange(deviceId));

  const selectRange = (key) => {
    setRange(key);
    try {
      localStorage.setItem(rangeStorageKey(deviceId), key);
    } catch {
      /* np. tryb prywatny */
    }
  };
  // Cache per zakres: powrót do raz pobranego zakresu pokazuje dane od razu
  // (bez spinnera), a fetch w tle tylko je odświeża.
  const [cache, setCache] = useState({});
  const [loading, setLoading] = useState(true);
  const data = cache[range] ?? null;

  const deviceRef = useRef(deviceId);
  if (deviceRef.current !== deviceId) {
    deviceRef.current = deviceId;
    setCache({});
  }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const fresh = await fetchDeviceHistory(deviceId, range);
      setCache((prev) => ({ ...prev, [range]: fresh }));
    } catch {
      // błąd: zostawiamy cache — stare dane lepsze niż pusty wykres
    } finally {
      setLoading(false);
    }
  }, [deviceId, range]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  usePolling({ intervalMs: 600000, enabled: true, onTick: load });

  const series = data?.series || [];
  const summary = data?.summary;

  return (
    <div className="mt-3 pt-3 border-t border-slate-700/50">
      {/* Przełącznik zakresu */}
      <div className="flex items-center gap-1 mb-3">
        {RANGES.map((r) => (
          <button
            key={r.key}
            type="button"
            onClick={() => selectRange(r.key)}
            className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${
              range === r.key
                ? "bg-indigo-500 text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-700/50"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Podsumowanie — zużycie w okresie + szczyt mocy + koszt (przy ustawionej cenie kWh) */}
      <div className="grid grid-cols-3 gap-2 mb-2">
        <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 rounded-xl p-2.5">
          <p className="text-emerald-400 text-[11px] font-medium mb-0.5 flex items-center gap-1">
            <Activity className="w-3 h-3" /> Zużycie
          </p>
          <p className="text-lg font-bold text-white leading-none whitespace-nowrap">
            <span className="sm:hidden">
              {fmtKwhMobile(summary?.energyKwh)}
            </span>
            <span className="hidden sm:inline">
              {fmtKwh(summary?.energyKwh)}
            </span>{" "}
            <span className="text-xs font-medium text-slate-400">kWh</span>
          </p>
        </div>
        <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 rounded-xl p-2.5">
          <p className="text-amber-400 text-[11px] font-medium mb-0.5 flex items-center gap-1">
            <Zap className="w-3 h-3" />{" "}
            <span className="sm:hidden">Szczyt</span>
            <span className="hidden sm:inline">Szczyt mocy</span>
          </p>
          <p className="text-lg font-bold text-white leading-none whitespace-nowrap">
            {summary?.peakW != null ? summary.peakW : "—"}{" "}
            <span className="text-xs font-medium text-slate-400">W</span>
          </p>
        </div>
        <div className="bg-gradient-to-br from-sky-500/20 to-sky-600/10 border border-sky-500/30 rounded-xl p-2.5">
          <p className="text-sky-400 text-[11px] font-medium mb-0.5 flex items-center gap-1">
            <Banknote className="w-3 h-3" /> Koszt
          </p>
          <p className="text-lg font-bold text-white leading-none whitespace-nowrap">
            {summary?.costPln != null ? summary.costPln.toFixed(2) : "—"}{" "}
            <span className="text-xs font-medium text-slate-400">zł</span>
          </p>
        </div>
      </div>

      {/* Wykres na gradientowym panelu */}
      <div className="bg-gradient-to-br from-indigo-500/15 to-purple-600/5 border border-indigo-500/25 rounded-xl p-2">
        {loading && !data ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
          </div>
        ) : series.length === 0 ? (
          <p className="text-xs text-slate-400 py-8 text-center">
            Za mało pomiarów dla tego okresu.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={150}>
            <AreaChart
              data={series}
              margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient
                  id={`grad-${deviceId}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#818cf8" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#818cf8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#3f3f6e"
                vertical={false}
              />
              <XAxis
                dataKey="t"
                tickFormatter={(t) => formatTick(t, range)}
                tick={{ fontSize: 10, fill: "#a5b4fc" }}
                stroke="#3f3f6e"
                minTickGap={24}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#c7d2fe" }}
                stroke="#3f3f6e"
                width={48}
                tickFormatter={(v) => `${Math.round(v)} W`}
              />
              <Tooltip
                contentStyle={{
                  background: "#1e1b4b",
                  border: "1px solid #4f46e5",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelStyle={{ color: "#c7d2fe" }}
                labelFormatter={(t) =>
                  new Date(t).toLocaleString("pl-PL", { timeZone: TZ })
                }
                formatter={(v, name) => [
                  `${v ?? "—"} W`,
                  name === "avgW" ? "Śr. moc" : name,
                ]}
              />
              <Area
                type="monotone"
                dataKey="avgW"
                stroke="#a78bfa"
                strokeWidth={2}
                fill={`url(#grad-${deviceId})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
