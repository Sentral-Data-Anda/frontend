import type { UseFormReturn } from "react-hook-form";

import type { SelectOption } from "@/components/common/control";

import type { SetelanFormValues } from "../model";

export type SetelanForm = UseFormReturn<SetelanFormValues>;

export const withEmptyOption = (
  label: string,
  options: readonly SelectOption[],
): SelectOption[] => [{ value: "", label }, ...options];

export type TierButton = "up" | "down" | "remove";

export const tierButtonId = (index: number, button: TierButton) =>
  `tier-${index}-${button}`;
