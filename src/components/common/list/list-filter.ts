import type { SelectOption } from "@/components/common/control";

export type ListFilter = {
  key: string;
  label: string;
  kind: "select" | "choice";
  options: readonly SelectOption[];
  emptyMessage?: string;
  chipLabel?: (optionLabel: string) => string;
};

export type FilterValues = Record<string, string>;

export type ActiveFilter = { key: string; label: string; chip: string };

export const pickFilterValues = (
  filters: readonly ListFilter[],
  values: FilterValues,
): FilterValues =>
  Object.fromEntries(filters.map(({ key }) => [key, values[key] ?? ""]));

export const listActiveFilters = (
  filters: readonly ListFilter[],
  values: FilterValues,
): ActiveFilter[] =>
  filters.flatMap((filter) => {
    const value = values[filter.key];
    const optionLabel = filter.options.find(
      (option) => option.value === value,
    )?.label;

    if (!value) return [];

    return {
      key: filter.key,
      label: filter.label,
      chip: optionLabel
        ? (filter.chipLabel?.(optionLabel) ?? optionLabel)
        : filter.label,
    };
  });
