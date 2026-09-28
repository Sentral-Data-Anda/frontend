import type { UseFormReturn } from "react-hook-form";

import type { SelectOption } from "@/components/common/control";

import type { SetelanFormValues } from "../model";

export type SetelanForm = UseFormReturn<SetelanFormValues>;

export const withEmptyOption = (
  label: string,
  options: readonly SelectOption[],
): SelectOption[] => [{ value: "", label }, ...options];

export const TIER_PREFIX = "tier";
