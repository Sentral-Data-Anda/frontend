import { z } from "zod";

import {
  MENU,
  createHref,
  detailHref,
  editHref,
  menuHref,
} from "@/config/menu";
import { FetchError } from "@/lib/api/fetcher";
import { collapseSpaces } from "@/lib/name";
import { ACCOUNT_TYPES } from "@/types/keuangan";

import type { Account, AccountPayload, AccountTreeRow } from "./types";

export const AKUN_LIST_PATH = menuHref(MENU.FINANCE, MENU.CHART_OF_ACCOUNT);

export const AKUN_CREATE_PATH = createHref(MENU.FINANCE, MENU.CHART_OF_ACCOUNT);

export const accountDetailHref = (code: string) =>
  detailHref(MENU.FINANCE, MENU.CHART_OF_ACCOUNT, code);

export const accountEditHref = (code: string) =>
  editHref(MENU.FINANCE, MENU.CHART_OF_ACCOUNT, code);

export const ledgerHref = (code: string) =>
  `${menuHref(MENU.REPORT, MENU.FINANCIAL_STATEMENT)}?tab=buku-besar&code=${encodeURIComponent(code)}`;

export const NO_VIEW = "Peran Anda tidak memiliki akses ke Akun.";

export const EMPTY_TITLE = "Belum ada akun";

export const EMPTY_DESCRIPTION =
  "Daftar akun adalah dasar seluruh pembukuan. Sebelum ada isinya, tidak ada yang bisa dicatat atau diposting.";

export const PARENT_NOTE =
  "Akun yang dipakai sebagai judul kelompok sebaiknya tidak menampung transaksi. Sistem tidak mencegahnya, dan posting ke akun induk akan terhitung dua kali di laporan.";

const byCode = (a: Account, b: Account) => a.code.localeCompare(b.code, "id");

export function accountRows(
  items: Account[],
  isFlat = false,
): AccountTreeRow[] {
  if (isFlat) return items.map((item) => ({ ...item, depth: 0 }));

  const ids = new Set(items.map((item) => item.id));
  const byParent = new Map<number | null, Account[]>();

  for (const item of items) {
    const parentId =
      item.parentAccountId !== null && ids.has(item.parentAccountId)
        ? item.parentAccountId
        : null;

    byParent.set(parentId, [...(byParent.get(parentId) ?? []), item]);
  }

  const rows: AccountTreeRow[] = [];

  const walk = (parentId: number | null, depth: number) => {
    for (const item of [...(byParent.get(parentId) ?? [])].sort(byCode)) {
      rows.push({ ...item, depth });
      walk(item.id, depth + 1);
    }
  };

  walk(null, 0);

  return rows;
}

export const childCountLabel = (count: number) =>
  count > 0 ? `${count} sub akun` : null;

export const accountDeleteText = (account: Pick<Account, "code" | "name">) =>
  `Apakah Anda ingin menghapus akun ${account.code} — ${account.name}? Akun yang sudah dipakai tidak bisa dihapus, hanya dinonaktifkan.`;

export const ACCOUNT_IN_USE = "ACCOUNT_IN_USE";

export const ACCOUNT_TYPE_LOCKED_HINT =
  "Tipe tidak dapat diubah karena akun sudah dipakai jurnal.";

export const isDeactivateOffered = (error: unknown) =>
  error instanceof FetchError && error.code === ACCOUNT_IN_USE;

export const NET_ASSET_HINT =
  "Pilih Dengan pembatasan hanya untuk dana yang pemberinya menentukan penggunaannya — dana pembangunan, beasiswa. Dana seperti itu butuh akun pendapatan DAN akun bebannya sendiri.";

export const CASH_FLOW_HINT =
  "Tandai Kas dan setara kas pada rekening kas dan bank: Laporan Arus Kas menjelaskan pergerakan saldo itu. Akun lain boleh dibiarkan ikut tipe akunnya, kecuali yang tebakannya salah — Persediaan adalah operasi, bukan investasi.";

export const accountFormSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Isi kode akun")
    .max(20, "Kode akun maksimal 20 karakter")
    .regex(
      /^[A-Za-z0-9.-]*$/,
      "Kode akun hanya boleh huruf, angka, titik, dan strip",
    ),
  name: z
    .string()
    .transform(collapseSpaces)
    .pipe(
      z
        .string()
        .min(1, "Isi nama akun")
        .max(100, "Nama akun maksimal 100 karakter"),
    ),
  type: z.enum(ACCOUNT_TYPES, { message: "Pilih tipe akun" }),
  parentAccountId: z.string(),
  // Disimpan sebagai STRING, seperti setiap picker lain: "" berarti belum
  // dipilih, dan "" yang dikirim sebagai null. Null punya arti di keduanya,
  // jadi "belum dipilih" adalah jawaban yang sah dan bukan form yang kurang.
  netAssetClass: z.string(),
  cashFlowCategory: z.string(),
  isActive: z.enum(["true", "false"]),
});

export type AccountFormValues = z.infer<typeof accountFormSchema>;

export const EMPTY_ACCOUNT_FORM: AccountFormValues = {
  code: "",
  name: "",
  type: "ASSET",
  parentAccountId: "",
  isActive: "true",
  netAssetClass: "",
  cashFlowCategory: "",
};

export const toAccountCode = (value: string) =>
  value
    .toUpperCase()
    .replace(/[^A-Z0-9.-]/g, "")
    .slice(0, 20);

export const toAccountPayload = (
  values: AccountFormValues,
): AccountPayload => ({
  code: values.code.trim().toUpperCase(),
  name: collapseSpaces(values.name),
  type: values.type,
  parentAccountId: values.parentAccountId
    ? Number(values.parentAccountId)
    : null,
  isActive: values.isActive === "true",
  // SELALU dikirim, termasuk saat null: server membedakan null (kosongkan
  // klasifikasinya) dari field yang tidak dikirim (biarkan apa adanya), jadi
  // menghilangkannya membuat picker yang dikosongkan tidak pernah terkosongkan.
  netAssetClass: (values.netAssetClass ||
    null) as AccountPayload["netAssetClass"],
  cashFlowCategory: (values.cashFlowCategory ||
    null) as AccountPayload["cashFlowCategory"],
});

export const toAccountForm = (account: Account): AccountFormValues => ({
  code: account.code,
  name: account.name,
  type: account.type,
  parentAccountId:
    account.parentAccountId === null ? "" : String(account.parentAccountId),
  isActive: account.isActive ? "true" : "false",
  netAssetClass: account.netAssetClass ?? "",
  cashFlowCategory: account.cashFlowCategory ?? "",
});

export function accountServerError(message: string) {
  if (/akun sudah tersedia/i.test(message)) {
    return { field: "code", message: "Kode ini sudah dipakai akun lain" };
  }

  return null;
}
