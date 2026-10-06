import { type UseFormReturn } from "react-hook-form";

import { optionsOf } from "@/components/common/control";

import { type CutiFormValues } from "../model";

export type CutiForm = UseFormReturn<CutiFormValues>;

export const LENGTH_OPTIONS = optionsOf({
  penuh: "Sehari penuh",
  setengah: "Setengah hari",
});
