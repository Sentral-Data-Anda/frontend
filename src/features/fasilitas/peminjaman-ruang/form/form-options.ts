import type { UseFormReturn } from "react-hook-form";

import { optionsOf } from "@/components/common/control";

import type { LoanFormValues } from "../model";
import { REPEAT_LABEL } from "../types";

export type LoanForm = UseFormReturn<LoanFormValues>;

export const REPEAT_OPTIONS = optionsOf(REPEAT_LABEL);

export const isTimeRange = (startTime: string, endTime: string) =>
  Boolean(startTime && endTime && endTime > startTime);
