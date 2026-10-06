import { type UseFormReturn } from "react-hook-form";

import { optionsOf } from "@/components/common/control";

import { type AbsensiFormValues } from "../model";
import { ATTENDANCE_STATUS_LABEL } from "../types";

export type AbsensiForm = UseFormReturn<AbsensiFormValues>;

export const STATUS_OPTIONS = optionsOf(ATTENDANCE_STATUS_LABEL);
