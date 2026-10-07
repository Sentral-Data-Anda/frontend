import { type UseFormReturn } from "react-hook-form";

import type { SelectOption } from "@/components/common/control";

import { type IbadahFormValues } from "../model";

export type IbadahForm = UseFormReturn<IbadahFormValues>;

export const withNoneOption = (
  label: string,
  options: readonly SelectOption[],
): readonly SelectOption[] =>
  options.length ? [{ value: "", label }, ...options] : options;
