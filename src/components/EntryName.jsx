import { useState } from 'react';

/**
 * Nazwa wpisu przychodu/wydatku. Opisy z banku bywają bardzo długie i nie mają
 * spacji (np. „…KAPITAŁ: 1040,29 ODSETKI:…51020490000000869604605731”), więc na
 * mobile rozpychały wiersz poza kartę. Domyślnie przycinamy tekst do dwóch
 * linii, a tapnięcie rozwija pełny opis.
 */
export const EntryName = ({ name }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <button
      type="button"
      onClick={() => setExpanded((v) => !v)}
      title={name}
      aria-expanded={expanded}
      aria-label={expanded ? `Zwiń opis: ${name}` : `Rozwiń pełny opis: ${name}`}
      className={`finance-entry-name font-medium text-white text-left hover:text-slate-200 focus:outline-none focus:text-slate-200 ${expanded ? 'is-expanded' : ''}`}
    >
      {name}
    </button>
  );
};
