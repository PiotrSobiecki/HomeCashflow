import { Merge } from 'lucide-react';

const formatCurrency = (amount) =>
  new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', minimumFractionDigits: 2 }).format(amount);

export const sameAmount = (a, b) => Math.abs(Number(a) - Number(b)) < 0.005;

/**
 * Pozycje stałe, z którymi da się scalić wpis z banku: ta sama kwota co do grosza,
 * wiersz już zapisany na serwerze (ma updatedAt) i user może go zmieniać.
 * Wpis z banku o kwocie równej pozycji stałej to zwykle jej obciążenie, którego
 * synchronizacja nie rozpoznała po nazwie (płatność kartą w PKO nie ma kontrahenta).
 */
export const mergeCandidates = (entry, fixedEntries, canMutate) =>
  entry?.source === 'bank' && !entry.isFixed
    ? fixedEntries.filter((f) => f.updatedAt && sameAmount(f.amount, entry.amount) && canMutate(f))
    : [];

export const mergeDescription = ({ entry, fixed }, targetLabel) =>
  `Wpis z banku „${entry.name}” (${formatCurrency(entry.amount)}) zniknie z listy i będzie liczony jako ${targetLabel} „${fixed.name}”. ` +
  'Kolejne operacje z banku na dokładnie tę kwotę synchronizacja przypisze do tej pozycji automatycznie.';

const controlClass =
  'flex items-center gap-1 px-2 py-0.5 bg-sky-500/15 border border-sky-500/40 rounded text-sky-200 text-xs hover:border-sky-400 focus:outline-none focus:border-sky-400';

export const MergeIntoFixedControl = ({ candidates, onPick }) => {
  if (candidates.length === 0) return null;
  if (candidates.length === 1) {
    return (
      <button type="button" onClick={() => onPick(candidates[0])} className={controlClass} title="Scal z pozycją stałą">
        <Merge className="w-3 h-3" />
        Scal z „{candidates[0].name}”
      </button>
    );
  }
  return (
    <select
      value=""
      onChange={(e) => {
        const fixed = candidates.find((c) => String(c.id) === e.target.value);
        if (fixed) onPick(fixed);
      }}
      aria-label="Scal z pozycją stałą"
      className={controlClass}
    >
      <option value="">Scal z pozycją stałą…</option>
      {candidates.map((f) => (
        <option key={f.id} value={f.id}>
          {f.name}
        </option>
      ))}
    </select>
  );
};
