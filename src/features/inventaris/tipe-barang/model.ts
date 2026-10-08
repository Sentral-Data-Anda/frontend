import { z } from "zod";

import { MENU, menuHref } from "@/config/menu";
import { collapseSpaces } from "@/lib/name";

import type { TipeBarang, TipeBarangPayload } from "./types";

export const TIPE_BARANG_LIST_PATH = menuHref(
  MENU.INVENTARIS,
  MENU.TIPE_BARANG,
);

const NAME_ERROR = "Isi nama tipe, minimal 2 karakter";

export const tipeBarangFormSchema = z.object({
  name: z
    .string()
    .transform(collapseSpaces)
    .pipe(
      z.string().min(2, NAME_ERROR).max(50, "Nama tipe maksimal 50 karakter"),
    ),

  // Disimpan sebagai STRING di form, seperti setiap picker lain di aplikasi
  // ini: "" berarti belum dipilih, dan dia yang dikirim sebagai null.
  assetAccountId: z.string(),
  depreciationExpenseAccountId: z.string(),
  accumulatedDepreciationAccountId: z.string(),
  inventoryExpenseAccountId: z.string(),
});

export type TipeBarangFormValues = z.infer<typeof tipeBarangFormSchema>;

export const EMPTY_TIPE_BARANG_FORM: TipeBarangFormValues = {
  name: "",
  assetAccountId: "",
  depreciationExpenseAccountId: "",
  accumulatedDepreciationAccountId: "",
  inventoryExpenseAccountId: "",
};

/** `""` berarti belum dipilih, dan server menyimpannya sebagai null. */
const accountIdOf = (value: string): number | null =>
  value === "" ? null : Number(value);

export const toTipeBarangPayload = (
  values: TipeBarangFormValues,
): TipeBarangPayload => ({
  name: collapseSpaces(values.name),
  // Keempatnya SELALU dikirim, termasuk saat null: server membedakan null
  // (kosongkan akunnya) dari field yang tidak dikirim (biarkan apa adanya),
  // jadi menghilangkannya akan membuat picker yang dikosongkan tidak pernah
  // benar-benar terkosongkan.
  assetAccountId: accountIdOf(values.assetAccountId),
  depreciationExpenseAccountId: accountIdOf(
    values.depreciationExpenseAccountId,
  ),
  accumulatedDepreciationAccountId: accountIdOf(
    values.accumulatedDepreciationAccountId,
  ),
  inventoryExpenseAccountId: accountIdOf(values.inventoryExpenseAccountId),
});

export const toTipeBarangForm = (
  tipeBarang: TipeBarang,
): TipeBarangFormValues => ({
  name: tipeBarang.name,
  assetAccountId: idText(tipeBarang.assetAccount),
  depreciationExpenseAccountId: idText(tipeBarang.depreciationExpenseAccount),
  accumulatedDepreciationAccountId: idText(
    tipeBarang.accumulatedDepreciationAccount,
  ),
  inventoryExpenseAccountId: idText(tipeBarang.inventoryExpenseAccount),
});

/** Akun yang sudah tersimpan, dalam bentuk yang dipegang picker. */
const idText = (account: { id: number } | null): string =>
  account ? String(account.id) : "";

/** `kode — nama`, atau kalimat untuk akun yang belum diatur. */
export const accountText = (account: { code: string; name: string } | null) =>
  account ? `${account.code} — ${account.name}` : "Belum diatur";

const SERVER_FIELD_ERROR: ReadonlyArray<
  [RegExp, keyof TipeBarangFormValues, string?]
> = [
  [
    /tipe barang sudah tersedia/i,
    "name",
    "Tipe dengan nama ini sudah ada. Pakai nama lain.",
  ],
  // Tidak ada pola untuk penolakan akun, dan itu disengaja: server mengirim
  // path field-nya di `issues`, jadi picker yang salah tersorot sendiri.
  // Menebak satu field di sini akan menyorot picker yang keliru saat yang
  // bermasalah justru akun yang lain.
];

export function serverFieldError(
  message: string,
): { field: keyof TipeBarangFormValues; message: string } | null {
  for (const [pattern, field, override] of SERVER_FIELD_ERROR) {
    if (pattern.test(message)) {
      return { field, message: override ?? message };
    }
  }

  return null;
}
