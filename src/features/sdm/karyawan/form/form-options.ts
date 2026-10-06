import { type UseFormReturn } from "react-hook-form";

import { optionsOf } from "@/components/common/control";

import { type KaryawanFormValues } from "../model";
import { EMPLOYMENT_STATUS_LABEL } from "../types";

export type KaryawanForm = UseFormReturn<KaryawanFormValues>;

export const STATUS_OPTIONS = optionsOf(EMPLOYMENT_STATUS_LABEL);
