import { type UseFormReturn } from "react-hook-form";

import { optionsOf } from "@/components/common/control";

import { type SupplierFormValues } from "../model";
import { SUPPLIER_STATUS_LABEL } from "../types";

export type SupplierForm = UseFormReturn<SupplierFormValues>;

export const STATUS_OPTIONS = optionsOf(SUPPLIER_STATUS_LABEL);
