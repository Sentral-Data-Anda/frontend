import { type UseFormReturn } from "react-hook-form";

import { type EndMarriageFormValues, type MarriageFormValues } from "../model";

export type MarriageForm = UseFormReturn<MarriageFormValues>;
export type EndMarriageForm = UseFormReturn<EndMarriageFormValues>;
