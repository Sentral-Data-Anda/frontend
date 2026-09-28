import type { UseFormReturn } from "react-hook-form";

import { optionsOf, type SelectOption } from "@/components/common/control";
import { monthOptions } from "@/lib/date";

import {
  CONDITION_LABEL,
  SOURCE_LABEL,
  formatMonth,
  type AssetFormValues,
} from "../model";

export type BarangForm = UseFormReturn<AssetFormValues>;

export const CONDITION_OPTIONS = optionsOf(CONDITION_LABEL);

export const SOURCE_OPTIONS = optionsOf(SOURCE_LABEL);

export const DEPRECIABLE_OPTIONS = [
  { value: "0", label: "Tidak" },
  { value: "1", label: "Ya" },
];

export const LOCK_HINT = "Tidak bisa diubah karena sudah disusutkan.";

export const asOfOptions = (saved: string): SelectOption[] => {
  const months = monthOptions()
    .slice(1)
    .map((option) => ({ value: `${option.value}-01`, label: option.label }));

  return saved && !months.some((option) => option.value === saved)
    ? [...months, { value: saved, label: formatMonth(saved) }]
    : months;
};
