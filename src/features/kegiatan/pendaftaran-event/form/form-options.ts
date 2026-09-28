import { type UseFormReturn } from "react-hook-form";

import { optionsOf } from "@/components/common/control";

import { PARTICIPANT_KIND_LABEL, type RegistrationFormValues } from "../model";

export type RegistrationForm = UseFormReturn<RegistrationFormValues>;

export const KIND_OPTIONS = optionsOf(PARTICIPANT_KIND_LABEL);

export const EMPTY_EVENT_MESSAGE = "Belum ada event yang bisa didaftari.";
