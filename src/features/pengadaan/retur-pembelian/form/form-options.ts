import type { UseFormReturn } from "react-hook-form";

import type { ReturnFormValues } from "../model";

export type ReturnForm = UseFormReturn<ReturnFormValues>;

export const LINE_FIELDS = ["quantity", "reason"] as const;
