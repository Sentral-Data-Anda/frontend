import { type UseFormReturn } from "react-hook-form";

import { type CurrencyFormValues, type RateFormValues } from "../model";

export type CurrencyForm = UseFormReturn<CurrencyFormValues>;

export type RateForm = UseFormReturn<RateFormValues>;
