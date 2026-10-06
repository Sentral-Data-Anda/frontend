import { type UseFormReturn } from "react-hook-form";

import { optionsOf } from "@/components/common/control";

import { type KomponenFormValues } from "../model";
import {
  CALCULATION_TYPE_LABEL,
  COMPONENT_STATUS_LABEL,
  COMPONENT_TYPE_LABEL,
} from "../types";

export type KomponenForm = UseFormReturn<KomponenFormValues>;

export const TYPE_OPTIONS = optionsOf(COMPONENT_TYPE_LABEL);

export const CALCULATION_OPTIONS = optionsOf(CALCULATION_TYPE_LABEL);

export const STATUS_OPTIONS = optionsOf(COMPONENT_STATUS_LABEL);

export const TAXABLE_OPTIONS = optionsOf({
  true: "Kena pajak",
  false: "Tidak kena pajak",
});

export const DEFAULT_VALUE_OPTIONS = optionsOf({
  nilai: "Sama untuk semua",
  kosong: "Berbeda per orang",
});
