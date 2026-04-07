import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { X } from "lucide-react";

const INCOME_COLORS = [
  "#10B981", // emerald
  "#059669", // emerald dark
  "#14B8A6", // teal
  "#06B6D4", // cyan
  "#0EA5E9", // sky
  "#3B82F6", // blue
  "#34D399", // emerald light
  "#22D3EE", // cyan light
];

const VARIABLE_EXPENSE_COLORS = [
  "#DC2626", // red
  "#BE123C", // rose dark
  "#E11D48", // rose
  "#9F1239", // red wine
  "#EA580C", // orange dark
  "#F97316", // orange
  "#F59E0B", // amber
  "#FB923C", // orange light
];

const FIXED_EXPENSE_COLOR = "#B91C1C"; // deep red

const formatCurrency = (amount) =>
  new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
    minimumFractionDigits: 2,
  }).format(amount || 0);

const toAmount = (value) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const normalized = value.replace(",", ".").trim();
    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const buildExpenseCategoryData = (expenses) => {
  const grouped = {};
  for (const exp of expenses) {
    const key = exp?.isFixed ? "Stale" : (exp?.category || "Inne");
    if (!grouped[key]) {
      grouped[key] = { total: 0, fixed: 0, variable: 0 };
    }
    const amount = toAmount(exp?.amount);
    grouped[key].total += amount;
    if (exp?.isFixed) grouped[key].fixed += amount;
    else grouped[key].variable += amount;
  }
  return Object.entries(grouped)
    .map(([name, stats]) => ({
      name,
      value: stats.total,
      fixed: stats.fixed,
      variable: stats.variable,
    }))
    .sort((a, b) => b.value - a.value);
};

const buildIncomeSourceData = (incomes) => {
  const grouped = {};
  for (const inc of incomes) {
    const key = inc.name || "Nieznane zrodlo";
    grouped[key] = (grouped[key] || 0) + toAmount(inc.amount);
  }
  return Object.entries(grouped)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
};

const renderTooltip = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0];
  const point = item.payload || {};
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs">
      <p className="text-slate-300">{item.name}</p>
      <p className="text-white font-medium">{formatCurrency(item.value)}</p>
      {typeof point.fixed === "number" && typeof point.variable === "number" && (
        <p className="text-slate-400 mt-1">
          stale: {formatCurrency(point.fixed)} • zmienne: {formatCurrency(point.variable)}
        </p>
      )}
    </div>
  );
};

const getIncomeColor = (index) => INCOME_COLORS[index % INCOME_COLORS.length];

const getExpenseColor = (entry, index) => {
  if (entry?.name === "Stale") return FIXED_EXPENSE_COLOR;
  return VARIABLE_EXPENSE_COLORS[index % VARIABLE_EXPENSE_COLORS.length];
};

const EmptyChart = ({ label }) => (
  <div className="h-[260px] flex items-center justify-center text-slate-500 text-sm border border-dashed border-slate-700 rounded-xl bg-slate-900/30">
    {label}
  </div>
);

export const MonthlySummaryModal = ({
  open = false,
  onClose,
  monthLabel,
  incomes = [],
  expenses = [],
  embedded = false,
}) => {
  if (!embedded && !open) return null;

  const expenseData = buildExpenseCategoryData(expenses);
  const incomeData = buildIncomeSourceData(incomes);

  const content = (
    <div
      className={`w-full ${embedded ? "max-w-none" : "max-w-6xl max-h-[90vh] overflow-y-auto"} overflow-hidden bg-slate-800/50 border border-slate-700/50 rounded-2xl shadow-2xl`}
    >
      <div
        className={`${embedded ? "" : "sticky top-0 z-10"} flex items-center justify-between px-6 py-4 border-b border-slate-700/50 bg-slate-800/50 backdrop-blur`}
      >
        <div>
          <h2 className="text-xl font-semibold text-white">
            Podsumowanie miesięczne
          </h2>
          <p className="text-sm text-slate-400">{monthLabel}</p>
        </div>
        {!embedded && (
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
        <section className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4">
          <h3 className="text-base font-semibold text-white mb-3">
            Przychody (źródła)
          </h3>
          {incomeData.length === 0 ? (
            <EmptyChart label="Brak przychodow w wybranym miesiacu." />
          ) : (
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={incomeData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={95}
                    innerRadius={35}
                  >
                    {incomeData.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={getIncomeColor(index)}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={renderTooltip} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4">
          <h3 className="text-base font-semibold text-white mb-3">
            Wydatki per kategoria (w tym stałe)
          </h3>
          {expenseData.length === 0 ? (
            <EmptyChart label="Brak wydatków w wybranym miesiącu." />
          ) : (
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={95}
                    innerRadius={35}
                  >
                    {expenseData.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={getExpenseColor(entry, index)}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={renderTooltip} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      </div>
    </div>
  );

  if (embedded) return content;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      {content}
    </div>
  );
};
