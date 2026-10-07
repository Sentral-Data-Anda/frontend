import type { SelectOption } from "@/components/common/control";

export type ListFilter = {
  key: string;
  label: string;
  kind: "select" | "choice";
  options: readonly SelectOption[];
  /**
   * Nilai saat filter ini tidak menyaring apa pun — sama dengan `defaultValue`
   * di `ListFilterSchema`-nya, dan `""` bila tidak disebut. Layar yang URL
   * kosongnya justru menyaring (mis. bawaan "bulan ini") menyebutnya, supaya
   * label filter aktif dan Reset tidak membaca bawaannya sebagai netral.
   */
  defaultValue?: string;
  emptyMessage?: string;
  chipLabel?: (optionLabel: string) => string;
};

export type FilterValues = Record<string, string>;

export type ActiveFilter = { key: string; label: string; chip: string };

export const pickFilterValues = (
  filters: readonly ListFilter[],
  values: FilterValues,
): FilterValues =>
  Object.fromEntries(
    filters.map(({ key, defaultValue }) => [
      key,
      values[key] ?? defaultValue ?? "",
    ]),
  );

export const defaultValueOf = (
  filters: readonly ListFilter[],
  key: string,
): string => filters.find((filter) => filter.key === key)?.defaultValue ?? "";

/**
 * Aktif berarti berbeda dari bawaan filternya, bukan sekadar tidak kosong: di
 * layar yang bawaannya menyaring, justru nilai kosong yang aktif.
 */
export const listActiveFilters = (
  filters: readonly ListFilter[],
  values: FilterValues,
): ActiveFilter[] =>
  filters.flatMap((filter) => {
    const value = values[filter.key] ?? "";
    const optionLabel = filter.options.find(
      (option) => option.value === value,
    )?.label;

    if (value === (filter.defaultValue ?? "")) return [];

    return {
      key: filter.key,
      label: filter.label,
      chip: optionLabel
        ? (filter.chipLabel?.(optionLabel) ?? optionLabel)
        : filter.label,
    };
  });
