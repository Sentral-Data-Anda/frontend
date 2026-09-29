import type { UseFormReturn } from "react-hook-form";

import { optionsOf } from "@/components/common/control";

import { DISPOSAL_METHOD_LABEL, type DisposalFormValues } from "../../model";

export type DisposalForm = UseFormReturn<DisposalFormValues>;

export const METHOD_OPTIONS = optionsOf(DISPOSAL_METHOD_LABEL);

export const SUBMIT_DESCRIPTIONS = {
  delete:
    "Apakah Anda ingin mengajukan pelepasan barang ini? Selama menunggu persetujuan barang tidak bisa diubah atau dipindah; bila disetujui, pelepasan tidak bisa dibatalkan.",
};
