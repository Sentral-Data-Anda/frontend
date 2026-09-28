import type { UseFormReturn } from "react-hook-form";

import type { TransferFormValues } from "../../model";

export type TransferForm = UseFormReturn<TransferFormValues>;

export const SAVE_DESCRIPTIONS = {
  save: "Apakah Anda ingin memindahkan barang ini? Catatan pindah lokasi tidak bisa diubah atau dihapus.",
};
