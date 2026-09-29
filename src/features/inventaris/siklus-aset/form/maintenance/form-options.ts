import type { UseFormReturn } from "react-hook-form";

import { optionsOf } from "@/components/common/control";

import {
  MAINTENANCE_STATUS_LABEL,
  type MaintenanceFormValues,
} from "../../model";

export type MaintenanceForm = UseFormReturn<MaintenanceFormValues>;

export const STATUS_OPTIONS = optionsOf(MAINTENANCE_STATUS_LABEL);
