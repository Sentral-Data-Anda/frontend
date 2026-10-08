import type { SelectOption } from "@/components/common/control";
import { ACCOUNT_TYPE_LABEL, type AccountType } from "@/types/keuangan";

export type NetAssetClass = "TANPA_PEMBATASAN" | "DENGAN_PEMBATASAN";

export type CashFlowCategory = "KAS" | "OPERASI" | "INVESTASI" | "PENDANAAN";

/**
 * Kelas aset neto ISAK 35, dengan "belum ditentukan" sebagai pilihan nyata.
 *
 * "" bukan nilai yang hilang: ia dikirim sebagai null, dan null DIBACA tanpa
 * pembatasan. Memaksa memilih akan membuat bagan akun gereja harus diisi
 * seluruhnya sebelum satu laporan pun bisa terbit.
 */
export const NET_ASSET_CLASS_OPTIONS: SelectOption[] = [
  { value: "", label: "Tanpa pembatasan (bawaan)" },
  { value: "DENGAN_PEMBATASAN", label: "Dengan pembatasan" },
];

export const CASH_FLOW_CATEGORY_OPTIONS: SelectOption[] = [
  { value: "", label: "Ikuti tipe akun" },
  { value: "KAS", label: "Kas dan setara kas" },
  { value: "OPERASI", label: "Aktivitas operasi" },
  { value: "INVESTASI", label: "Aktivitas investasi" },
  { value: "PENDANAAN", label: "Aktivitas pendanaan" },
];

export type Account = {
  id: number;
  publicId: string;
  code: string;
  name: string;
  type: AccountType;
  parentAccountId: number | null;
  parent: { id: number; code: string; name: string; type: AccountType } | null;
  isActive: boolean;
  /** ISAK 35. Null berarti tanpa pembatasan. */
  netAssetClass: NetAssetClass | null;
  /** KAS menandai akunnya sendiri. Null diturunkan dari tipenya. */
  cashFlowCategory: CashFlowCategory | null;
  childCount: number;
};

export type AccountDetail = Account & { hasJournalLines: boolean };

export type AccountPayload = {
  code: string;
  name: string;
  type: AccountType;
  parentAccountId: number | null;
  isActive: boolean;
  netAssetClass: NetAssetClass | null;
  cashFlowCategory: CashFlowCategory | null;
};

export type AccountTreeRow = Account & { depth: number };

export const ACCOUNT_STATUS_LABEL: Record<"true" | "false", string> = {
  true: "Aktif",
  false: "Nonaktif",
};

export const ACCOUNT_STATUS_FILTER: SelectOption[] = [
  { label: "Semua", value: "" },
  { label: ACCOUNT_STATUS_LABEL.true, value: "aktif" },
  { label: ACCOUNT_STATUS_LABEL.false, value: "nonaktif" },
];

export const ACCOUNT_TYPE_FILTER: SelectOption[] = [
  { label: "Semua tipe", value: "" },
  ...Object.entries(ACCOUNT_TYPE_LABEL).map(([value, label]) => ({
    value,
    label,
  })),
];

export const ACCOUNT_STATUS_OPTIONS: SelectOption[] = [
  { label: ACCOUNT_STATUS_LABEL.true, value: "true" },
  { label: ACCOUNT_STATUS_LABEL.false, value: "false" },
];

export const ACCOUNT_TYPE_OPTIONS: SelectOption[] = Object.entries(
  ACCOUNT_TYPE_LABEL,
).map(([value, label]) => ({ value, label }));
