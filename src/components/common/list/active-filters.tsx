"use client";

import { X } from "lucide-react";

import type { ActiveFilter } from "./list-filter";

interface PropTypes {
  filters: readonly ActiveFilter[];
  onRemove: (key: string) => void;
  onClearAll: () => void;
}

export const ActiveFilters = (props: PropTypes) => {
  const { filters, onRemove, onClearAll } = props;

  return (
    <ul
      aria-label="Filter aktif"
      className="mt-3 flex flex-wrap items-center gap-2"
    >
      {filters.map((filter) => (
        <li key={filter.key}>
          <button
            type="button"
            onClick={() => onRemove(filter.key)}
            aria-label={`Hapus filter ${filter.label}: ${filter.chip}`}
            className="bg-primary-100 hover:bg-primary-200 focus-visible:ring-ring flex h-7 max-w-full cursor-pointer items-center gap-1 rounded-full pr-2 pl-3 text-body font-medium transition-colors outline-none focus-visible:ring-2"
          >
            <span className="truncate">{filter.chip}</span>
            <X
              className="text-muted-foreground size-3.5 shrink-0"
              aria-hidden
            />
          </button>
        </li>
      ))}

      {filters.length >= 2 ? (
        <li>
          <button
            type="button"
            onClick={onClearAll}
            className="text-muted-foreground hover:text-foreground focus-visible:ring-ring flex h-7 cursor-pointer items-center rounded-full px-2 text-body font-medium underline underline-offset-4 outline-none focus-visible:ring-2"
          >
            Hapus semua
          </button>
        </li>
      ) : null}
    </ul>
  );
};
