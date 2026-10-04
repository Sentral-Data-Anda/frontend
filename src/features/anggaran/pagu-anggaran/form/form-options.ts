import { type UseFormReturn } from "react-hook-form";

import { type AllocationFormValues, type BatchFormValues } from "../model";

export type AllocationForm = UseFormReturn<AllocationFormValues>;

export type BatchForm = UseFormReturn<BatchFormValues>;
