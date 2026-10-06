import { type UseFormReturn } from "react-hook-form";

import { optionsOf } from "@/components/common/control";

import { type PenetapanFormValues } from "../model";

export type PenetapanForm = UseFormReturn<PenetapanFormValues>;

export const VALUE_MODE_OPTIONS = optionsOf({
  nilai: "Isi sendiri",
  kosong: "Pakai default komponen",
});
