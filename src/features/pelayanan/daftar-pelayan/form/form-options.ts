import { type UseFormReturn } from "react-hook-form";

import { optionsOf } from "@/components/common/control";

import { type PelayanFormValues } from "../model";
import { PELAYAN_STATUS_LABEL, TYPE_PELAYAN_LABEL } from "../types";

export type PelayanForm = UseFormReturn<PelayanFormValues>;

export const TYPE_OPTIONS = optionsOf(TYPE_PELAYAN_LABEL);

export const STATUS_OPTIONS = optionsOf(PELAYAN_STATUS_LABEL);
