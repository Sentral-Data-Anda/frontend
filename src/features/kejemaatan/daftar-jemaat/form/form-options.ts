import { type UseFormReturn } from "react-hook-form";

import { type SelectOption } from "@/components/common/control";

import { type JemaatFormValues } from "../model";

export type JemaatForm = UseFormReturn<JemaatFormValues>;

export const optionsOf = (labels: Record<string, string>): SelectOption[] =>
  Object.entries(labels).map(([value, label]) => ({ value, label }));
