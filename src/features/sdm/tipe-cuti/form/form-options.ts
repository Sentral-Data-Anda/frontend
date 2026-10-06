import { type UseFormReturn } from "react-hook-form";

import { optionsOf } from "@/components/common/control";

import { type TipeCutiFormValues } from "../model";
import {
  TIPE_CUTI_PAID_LABEL,
  TIPE_CUTI_QUOTA_LABEL,
  TIPE_CUTI_STATUS_LABEL,
} from "../types";

export type TipeCutiForm = UseFormReturn<TipeCutiFormValues>;

export const QUOTA_OPTIONS = optionsOf(TIPE_CUTI_QUOTA_LABEL);

export const PAID_OPTIONS = optionsOf(TIPE_CUTI_PAID_LABEL);

export const STATUS_OPTIONS = optionsOf(TIPE_CUTI_STATUS_LABEL);
