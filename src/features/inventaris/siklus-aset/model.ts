import type { ComponentProps } from "react";
import { z } from "zod";

import type { Badge } from "@/components/common/display";
import { MENU, detailHref, menuHref } from "@/config/menu";
import { monthRange, toDateInput, todayJakarta } from "@/lib/date";
import { formatRupiah } from "@/lib/format";

import type {
  AssetOption,
  CycleKind,
  DisposalMethod,
  DisposalPayload,
  DisposalStatus,
  Maintenance,
  MaintenancePayload,
  MaintenanceStatus,
  TransferPayload,
} from "./types";

type BadgeVariant = ComponentProps<typeof Badge>["variant"];

export const CYCLE_LIST_PATH = menuHref(MENU.INVENTARIS, MENU.SIKLUS_ASET);

export const KIND_PARAM = "jenis";

export const KIND_OPTIONS: { value: CycleKind; label: string }[] = [
  { value: "perawatan", label: "Perawatan" },
  { value: "pindah", label: "Pindah lokasi" },
  { value: "pelepasan", label: "Pelepasan" },
];

export const KIND_NOUN: Record<CycleKind, string> = {
  perawatan: "perawatan",
  pindah: "pindah lokasi",
  pelepasan: "pelepasan",
};

export const kindOf = (value: string | null | undefined): CycleKind =>
  value === "pindah" || value === "pelepasan" ? value : "perawatan";

export const cycleListHref = (kind: CycleKind) =>
  kind === "perawatan"
    ? CYCLE_LIST_PATH
    : `${CYCLE_LIST_PATH}?${KIND_PARAM}=${kind}`;

export const cycleCreateHref = (kind: CycleKind) =>
  `${CYCLE_LIST_PATH}/${kind}/baru`;

export const maintenanceEditHref = (code: string) =>
  `${CYCLE_LIST_PATH}/perawatan/${encodeURIComponent(code)}/ubah`;

export const transferHref = (code: string) =>
  `${CYCLE_LIST_PATH}/pindah/${encodeURIComponent(code)}`;

export const disposalHref = (code: string) =>
  `${CYCLE_LIST_PATH}/pelepasan/${encodeURIComponent(code)}`;

export const kindReturnHref = (saved: string, kind: CycleKind) => {
  const query = saved.split("?")[1] ?? "";

  return kindOf(new URLSearchParams(query).get(KIND_PARAM)) === kind
    ? saved
    : cycleListHref(kind);
};

export const assetHref = (code: string) =>
  detailHref(MENU.INVENTARIS, MENU.BARANG, code);

export const approvalHref = (publicId: string) =>
  detailHref(MENU.PERSETUJUAN, MENU.PERMINTAAN_PERSETUJUAN, publicId);

export const APPROVAL_SETTING_PATH = menuHref(
  MENU.PERSETUJUAN,
  MENU.SETELAN_PERSETUJUAN,
);

export const MAINTENANCE_STATUS_LABEL: Record<MaintenanceStatus, string> = {
  SCHEDULED: "Terjadwal",
  IN_PROGRESS: "Dikerjakan",
  DONE: "Selesai",
  CANCELLED: "Dibatalkan",
};

export const MAINTENANCE_STATUS_VARIANT: Record<
  MaintenanceStatus,
  BadgeVariant
> = {
  SCHEDULED: "wait",
  IN_PROGRESS: "draft",
  DONE: "success",
  CANCELLED: "neutral",
};

export const DISPOSAL_METHOD_LABEL: Record<DisposalMethod, string> = {
  SOLD: "Dijual",
  SCRAPPED: "Dimusnahkan",
  DONATED: "Dihibahkan",
  LOST: "Hilang",
};

export const DISPOSAL_STATUS_LABEL: Record<DisposalStatus, string> = {
  PENDING: "Menunggu persetujuan",
  APPROVED: "Disetujui",
  REJECTED: "Ditolak",
  CANCELLED: "Ditarik",
};

export const DISPOSAL_STATUS_VARIANT: Record<DisposalStatus, BadgeVariant> = {
  PENDING: "wait",
  APPROVED: "success",
  REJECTED: "due",
  CANCELLED: "neutral",
};

export const DISPOSAL_STATUS_NOTE: Record<DisposalStatus, string> = {
  PENDING: "Barang belum dilepas.",
  APPROVED: "Barang sudah dilepas.",
  REJECTED:
    "Barang tetap aktif; alasan penolakan ada di permintaan persetujuan.",
  CANCELLED: "Pengajuan ditarik; barang aktif lagi.",
};

export const moneyOf = (value: string | null) =>
  value === null ? null : formatRupiah(Number(value));

export const assetHintOf = (row: AssetOption) =>
  [row.code, row.room?.name].filter(Boolean).join(" · ");

export const assetCostHintOf = (row: AssetOption) =>
  [
    row.code,
    row.acquisitionCost === null
      ? "tanpa harga"
      : formatRupiah(Number(row.acquisitionCost)),
  ].join(" · ");

export const locationOf = (row: AssetOption) =>
  [row.room?.name, row.bapel?.name].filter(Boolean).join(" · ");

export function toCycleApiFilters(filters: Record<string, string>) {
  return {
    ...monthRange(filters.bulan ?? ""),
    method: filters.cara ?? "",
  };
}

const isFuture = (date: string) => Boolean(date) && date > todayJakarta();

const digitsOnly = z.string().regex(/^\d*$/, "Isi angka tanpa titik atau koma");

const optional = (value: string) => value.trim() || undefined;

const optionalNumber = (value: string) => (value ? Number(value) : undefined);

export const maintenanceFormSchema = z
  .object({
    assetId: z.string().min(1, "Pilih barang"),
    status: z.enum(["SCHEDULED", "IN_PROGRESS", "DONE", "CANCELLED"]),
    scheduledDate: z.string().min(1, "Tanggal rencana wajib diisi"),
    completedDate: z.string(),
    description: z
      .string()
      .trim()
      .min(1, "Keterangan wajib diisi")
      .max(250, "Keterangan maksimal 250 karakter"),
    cost: digitsOnly,
    supplierId: z.string(),
    performedBy: z.string().max(150, "Dikerjakan oleh maksimal 150 karakter"),
  })
  .superRefine((values, ctx) => {
    const issue = (path: string, message: string) =>
      ctx.addIssue({ code: "custom", path: [path], message });

    if (values.cost && Number(values.cost) < 1) {
      issue("cost", "Biaya harus lebih dari 0");
    }
    if (values.status !== "DONE") return;
    if (!values.completedDate) {
      issue(
        "completedDate",
        "Tanggal selesai wajib diisi untuk perawatan selesai",
      );
    } else if (isFuture(values.completedDate)) {
      issue("completedDate", "Tanggal selesai tidak boleh di masa depan");
    } else if (values.completedDate < values.scheduledDate) {
      issue(
        "completedDate",
        "Tanggal selesai tidak boleh sebelum tanggal rencana",
      );
    }
  });

export type MaintenanceFormValues = z.infer<typeof maintenanceFormSchema>;

export const EMPTY_MAINTENANCE_FORM: MaintenanceFormValues = {
  assetId: "",
  status: "SCHEDULED",
  scheduledDate: "",
  completedDate: "",
  description: "",
  cost: "",
  supplierId: "",
  performedBy: "",
};

export const toMaintenancePayload = (
  values: MaintenanceFormValues,
): MaintenancePayload => ({
  assetId: Number(values.assetId),
  status: values.status,
  scheduledDate: values.scheduledDate,
  completedDate:
    values.status === "DONE" ? optional(values.completedDate) : undefined,
  description: values.description.trim(),
  cost: optionalNumber(values.cost),
  supplierId: optionalNumber(values.supplierId),
  performedBy: optional(values.performedBy),
});

export const toMaintenanceForm = (row: Maintenance): MaintenanceFormValues => ({
  assetId: String(row.assetId),
  status: row.status,
  scheduledDate: toDateInput(row.scheduledDate),
  completedDate: toDateInput(row.completedDate),
  description: row.description,
  cost: row.cost === null ? "" : String(Math.round(Number(row.cost))),
  supplierId: row.supplierId === null ? "" : String(row.supplierId),
  performedBy: row.performedBy ?? "",
});

export const transferFormSchema = z
  .object({
    assetId: z.string().min(1, "Pilih barang"),
    fromRoomId: z.string(),
    fromBapelId: z.string(),
    toRoomId: z.string().min(1, "Pilih ruang tujuan"),
    toBapelId: z.string().min(1, "Pilih badan pelayanan tujuan"),
    transferDate: z.string().min(1, "Tanggal pindah wajib diisi"),
    reason: z.string().max(250, "Alasan maksimal 250 karakter"),
  })
  .superRefine((values, ctx) => {
    if (isFuture(values.transferDate)) {
      ctx.addIssue({
        code: "custom",
        path: ["transferDate"],
        message: "Tanggal pindah tidak boleh di masa depan",
      });
    }
    if (
      values.toRoomId &&
      values.toRoomId === values.fromRoomId &&
      values.toBapelId === values.fromBapelId
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["toRoomId"],
        message:
          "Pilih ruang atau badan pelayanan yang berbeda dari lokasi sekarang",
      });
    }
  });

export type TransferFormValues = z.infer<typeof transferFormSchema>;

export const emptyTransferForm = (): TransferFormValues => ({
  assetId: "",
  fromRoomId: "",
  fromBapelId: "",
  toRoomId: "",
  toBapelId: "",
  transferDate: todayJakarta(),
  reason: "",
});

export const toTransferPayload = (
  values: TransferFormValues,
): TransferPayload => ({
  assetId: Number(values.assetId),
  toRoomId: Number(values.toRoomId),
  toBapelId: Number(values.toBapelId),
  transferDate: values.transferDate,
  reason: optional(values.reason),
});

export const disposalFormSchema = z
  .object({
    assetId: z.string().min(1, "Pilih barang"),
    method: z.enum(["", "SOLD", "SCRAPPED", "DONATED", "LOST"]),
    disposalDate: z.string().min(1, "Tanggal pelepasan wajib diisi"),
    proceeds: digitsOnly,
    reason: z
      .string()
      .trim()
      .min(1, "Alasan wajib diisi")
      .max(250, "Alasan maksimal 250 karakter"),
  })
  .superRefine((values, ctx) => {
    const issue = (path: string, message: string) =>
      ctx.addIssue({ code: "custom", path: [path], message });

    if (!values.method) issue("method", "Pilih cara pelepasan");
    if (isFuture(values.disposalDate)) {
      issue("disposalDate", "Tanggal pelepasan tidak boleh di masa depan");
    }
    if (values.method === "SOLD" && !Number(values.proceeds)) {
      issue("proceeds", "Hasil penjualan wajib diisi untuk barang yang dijual");
    }
  });

export type DisposalFormValues = z.infer<typeof disposalFormSchema>;

export const emptyDisposalForm = (): DisposalFormValues => ({
  assetId: "",
  method: "",
  disposalDate: todayJakarta(),
  proceeds: "",
  reason: "",
});

export const toDisposalPayload = (
  values: DisposalFormValues,
): DisposalPayload => ({
  assetId: Number(values.assetId),
  method: values.method as DisposalMethod,
  disposalDate: values.disposalDate,
  reason: values.reason.trim(),
  proceeds: values.method === "SOLD" ? Number(values.proceeds) : undefined,
});

const FIELD_OF_MESSAGE: [RegExp, string][] = [
  [/sudah berada di ruangan/i, "toRoomId"],
  [/ruang tidak aktif/i, "toRoomId"],
  [/^barang (ini sudah dilepas|sedang menunggu|tidak ditemukan)/i, "assetId"],
  [/^supplier tidak ditemukan/i, "supplierId"],
];

export function serverFieldError(message: string) {
  const found = FIELD_OF_MESSAGE.find(([pattern]) => pattern.test(message));

  return found ? { field: found[1], message } : null;
}

export const isWorkflowMissing = (message: string) =>
  /alur persetujuan/i.test(message);

export const isRequestFinished = (message: string) =>
  /sudah selesai/i.test(message);
