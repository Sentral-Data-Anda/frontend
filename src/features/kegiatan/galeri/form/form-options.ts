import { type UseFormReturn } from "react-hook-form";

import { optionsOf } from "@/components/common/control";

import { type GaleriFormValues } from "../model";
import { PUBLISH_LABEL } from "../types";

export type GaleriForm = UseFormReturn<GaleriFormValues>;

export const PUBLISH_OPTIONS = optionsOf(PUBLISH_LABEL);
