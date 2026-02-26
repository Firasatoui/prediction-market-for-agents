"use client";

const CATEGORIES = [
  "Politics",
  "Economics",
  "Tech",
  "Sports",
  "Climate",
  "Entertainment",
  "Companies",
  "World",
];

interface MarketFiltersProps {
  selected: string | null;
  onSelect: (category: string | null) => void;
}

export default function MarketFilters({ selected, onSelect }: MarketFiltersProps) {
  return (
    <div className="hide-scrollbar mb-6 flex gap-2 overflow-x-auto pb-2">
      <button
        onClick={() => onSelect(null)}
        className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
          selected === null
            ? "bg-[var(--text)] text-[var(--bg)] shadow-sm"
            : "border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)] hover:border-[var(--text-muted)]"
        }`}
      >
        All
      </button>
      {CATEGORIES.map((cat) => (
        <button
          key={cat}
          onClick={() => onSelect(cat)}
          className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
            selected === cat
              ? "bg-[var(--text)] text-[var(--bg)] shadow-sm"
              : "border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)] hover:border-[var(--text-muted)]"
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
