import type { UseFormReturn } from "react-hook-form";

import type { RequestFormValues } from "../model";

export type RequestForm = UseFormReturn<RequestFormValues>;

export const LINE_FIELDS = ["name", "quantity", "estimatedUnitPrice"] as const;
