import { type UseFormReturn } from "react-hook-form";

import { type MovementFormValues } from "../model";

export type MovementForm = UseFormReturn<MovementFormValues>;

export const NOTE_COPY = {
  DONATION: {
    label: "Pemberi dan catatan",
    placeholder: "mis. Dari Ibu Rina untuk perjamuan kudus",
  },
  MANUAL: {
    label: "Catatan",
    placeholder: "mis. Dibeli di Toko Sinar, nota 0412",
  },
  OTHER: { label: "Catatan", placeholder: "mis. Dipakai untuk ibadah Minggu" },
};

export const noteCopyOf = (source: string) =>
  source === "DONATION" || source === "MANUAL"
    ? NOTE_COPY[source]
    : NOTE_COPY.OTHER;
