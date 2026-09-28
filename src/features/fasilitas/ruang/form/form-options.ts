import { type UseFormReturn } from "react-hook-form";

import { optionsOf } from "@/components/common/control";

import { type RuangFormValues } from "../model";
import { ROOM_STATUS_LABEL } from "../types";

export type RuangForm = UseFormReturn<RuangFormValues>;

export const STATUS_OPTIONS = optionsOf(ROOM_STATUS_LABEL);
