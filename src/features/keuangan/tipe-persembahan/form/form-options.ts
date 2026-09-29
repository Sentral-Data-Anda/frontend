import { type UseFormReturn } from "react-hook-form";

import { type SelectOption } from "@/components/common/control";

import { type OfferingTypeFormValues } from "../model";

export type OfferingTypeForm = UseFormReturn<OfferingTypeFormValues>;

export const YES_NO_OPTIONS: SelectOption[] = [
  { label: "Ya", value: "true" },
  { label: "Tidak", value: "false" },
];

export const STATUS_OPTIONS: SelectOption[] = [
  { label: "Aktif", value: "true" },
  { label: "Nonaktif", value: "false" },
];
