import { Pencil, Trash2 } from 'lucide-react';

const TOOLTIP = {
  income:
    'Ten przychód został wprowadzony przez właściciela gospodarstwa. Nie możesz go edytować ani usunąć.',
  expense:
    'Ten wydatek został wprowadzony przez właściciela gospodarstwa. Nie możesz go edytować ani usunąć.',
  savings:
    'Ten wpis oszczędności został wprowadzony przez właściciela gospodarstwa. Nie możesz go edytować ani usunąć.',
  categoryBudget:
    'Ten budżet kategorii został wprowadzony przez właściciela gospodarstwa. Nie możesz go edytować ani usunąć.',
};

/** Zastępuje napis „cudzy” — te same ikony co przy edycji, bez akcji + tooltip. */
export function ReadOnlyEntryActions({ kind }) {
  const tip = TOOLTIP[kind] ?? TOOLTIP.expense;
  return (
    <div className="flex shrink-0 gap-0.5" title={tip} aria-label={tip}>
      <span className="p-2 text-slate-600/70 cursor-not-allowed" aria-hidden>
        <Pencil className="w-4 h-4" />
      </span>
      <span className="p-2 text-slate-600/70 cursor-not-allowed" aria-hidden>
        <Trash2 className="w-4 h-4" />
      </span>
    </div>
  );
}
