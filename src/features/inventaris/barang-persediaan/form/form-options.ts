import { type UseFormReturn } from "react-hook-form";

import { type StockFormValues } from "../model";

export type StockForm = UseFormReturn<StockFormValues>;

export const savedOf = (form: StockForm, name: keyof StockFormValues) =>
  form.formState.defaultValues?.[name] ?? "";
