import { z } from "zod";

import {
  MENU,
  createHref,
  detailHref,
  editHref,
  menuHref,
} from "@/config/menu";
import { FetchError } from "@/lib/api/fetcher";
import {
  fromServerAttachment,
  keptAttachments,
  newAttachments,
} from "@/lib/attachment";
import { todayJakarta, toDateInput } from "@/lib/date";
import { toFormData } from "@/lib/form-data";
import { collapseSpaces } from "@/lib/name";
import type { AttachmentValue } from "@/types/attachment";

import type {
  AcquisitionSource,
  Asset,
  AssetCondition,
  AssetDetail,
  AssetStatus,
  CycleKind,
  DisposalMethod,
  MaintenanceStatus,
  Period,
} from "./types";

export const MAX_DETAIL_PHOTOS = 4;

export const BARANG_LIST_PATH = menuHref(MENU.INVENTARIS, MENU.BARANG);

export const BARANG_CREATE_PATH = createHref(MENU.INVENTARIS, MENU.BARANG);

export const barangDetailHref = (code: string) =>
  detailHref(MENU.INVENTARIS, MENU.BARANG, code);

export const barangEditHref = (code: string) =>
  editHref(MENU.INVENTARIS, MENU.BARANG, code);

const CYCLE_PATH = menuHref(MENU.INVENTARIS, MENU.SIKLUS_ASET);

export type CycleAction = "perawatan" | "pindah" | "pelepasan";

export const cycleCreateHref = (action: CycleAction, code: string) =>
  `${CYCLE_PATH}/${action}/baru?barang=${encodeURIComponent(code)}`;

export const disposalHref = (code: string) =>
  `${CYCLE_PATH}/pelepasan/${encodeURIComponent(code)}`;

export const CYCLE_TAB: Record<CycleKind, CycleAction> = {
  perawatan: "perawatan",
  mutasi: "pindah",
  pelepasan: "pelepasan",
};

export const cycleListHref = (kind: CycleKind, code: string) =>
  `${CYCLE_PATH}?jenis=${CYCLE_TAB[kind]}&search=${encodeURIComponent(code)}`;

export const approvalHref = (publicId: string) =>
  detailHref(MENU.PERSETUJUAN, MENU.PERMINTAAN_PERSETUJUAN, publicId);

export const CONDITION_LABEL: Record<AssetCondition, string> = {
  BAIK: "Baik",
  RUSAK_RINGAN: "Rusak ringan",
  RUSAK_BERAT: "Rusak berat",
  HILANG: "Hilang",
};

export const SOURCE_LABEL: Record<AcquisitionSource, string> = {
  PURCHASE: "Beli",
  DONATION: "Donasi",
  GRANT: "Hibah",
};

export const DISPOSAL_METHOD_LABEL: Record<DisposalMethod, string> = {
  SOLD: "Dijual",
  SCRAPPED: "Dimusnahkan",
  DONATED: "Dihibahkan",
  LOST: "Hilang",
};

export const MAINTENANCE_STATUS_LABEL: Record<MaintenanceStatus, string> = {
  SCHEDULED: "Terjadwal",
  IN_PROGRESS: "Dikerjakan",
  DONE: "Selesai",
  CANCELLED: "Dibatalkan",
};

export const STATUS_FILTER_LABEL: Record<string, string> = {
  aktif: "Aktif",
  menunggu: "Menunggu",
  dilepas: "Dilepas",
};

export type AssetStatusKey = Exclude<AssetStatus, "AKTIF"> | AssetCondition;

export const ASSET_STATUS_LABEL: Record<AssetStatusKey, string> = {
  ...CONDITION_LABEL,
  MENUNGGU_PELEPASAN: "Menunggu pelepasan",
  DILEPAS: "Dilepas",
};

export const assetStatusOf = (
  asset: Pick<Asset, "status" | "condition">,
): AssetStatusKey =>
  asset.status === "AKTIF" ? asset.condition : asset.status;

export const isActiveAsset = (asset: Pick<Asset, "status">) =>
  asset.status === "AKTIF";

export const isDonated = (source: AcquisitionSource) => source !== "PURCHASE";

export const costLabelOf = (source: AcquisitionSource) =>
  isDonated(source) ? "Nilai perolehan" : "Harga perolehan";

export const assetMetaOf = (asset: Pick<Asset, "type" | "room">) =>
  `${asset.type.name} · ${asset.room.name}`;

const monthFormat = new Intl.DateTimeFormat("id-ID", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export const formatMonth = (iso: string) =>
  monthFormat.format(new Date(`${iso.slice(0, 7)}-01T00:00:00Z`));

export const formatPeriod = (period: Period) =>
  formatMonth(`${period.year}-${String(period.month).padStart(2, "0")}`);

export const usefulLifeOf = (months: number) =>
  months % 12 === 0
    ? `${months} bulan (${months / 12} tahun)`
    : `${months} bulan`;

export const isWarrantyOver = (iso: string, today = todayJakarta()) =>
  toDateInput(iso) < today;

const AMOUNT = /^\d*(\.\d{1,2})?$/;

const amount = z.string().regex(AMOUNT, "Isi angka tanpa titik atau koma.");

const assetFields = z.object({
  name: z
    .string()
    .transform(collapseSpaces)
    .pipe(
      z
        .string()
        .min(4, "Isi nama barang, minimal 4 karakter")
        .max(150, "Nama barang maksimal 150 karakter"),
    ),
  typeId: z.string().min(1, "Pilih tipe barang"),
  condition: z.enum(["BAIK", "RUSAK_RINGAN", "RUSAK_BERAT", "HILANG"]),
  serialNumber: z.string().trim().max(100, "Nomor seri maksimal 100 karakter"),
  warrantyUntil: z.string(),
  description: z
    .string()
    .trim()
    .min(1, "Isi keterangan barang")
    .max(250, "Keterangan maksimal 250 karakter"),
  roomId: z.string().min(1, "Pilih ruang"),
  bapelId: z.string().min(1, "Pilih badan pelayanan"),
  acquisitionSource: z.enum(["PURCHASE", "DONATION", "GRANT"]),
  donorName: z.string().trim().max(150, "Nama pemberi maksimal 150 karakter"),
  acquisitionDate: z.string(),
  acquisitionCost: amount,
  isDepreciable: z.enum(["0", "1"]),
  usefulLifeMonths: amount,
  salvageValue: amount,
  depreciationStartDate: z.string(),
  openingAccumulatedDepreciation: amount,
  openingAccumulatedAsOf: z.string(),
  mainImage: z.array(z.custom<AttachmentValue>()).max(1),
  detailImage: z
    .array(z.custom<AttachmentValue>())
    .max(MAX_DETAIL_PHOTOS, `Foto detail maksimal ${MAX_DETAIL_PHOTOS}`),
});

export type AssetFormValues = z.infer<typeof assetFields>;

export const assetFormSchema = assetFields.superRefine((values, issues) => {
  const onIssue = (path: keyof AssetFormValues, message: string) =>
    issues.addIssue({ code: "custom", path: [path], message });

  if (values.isDepreciable !== "1") return;

  const cost = Number(values.acquisitionCost);
  const salvage = Number(values.salvageValue);
  const opening = values.openingAccumulatedDepreciation;
  const asOf = values.openingAccumulatedAsOf;

  if (!values.acquisitionCost) {
    onIssue(
      "acquisitionCost",
      "Isi harga perolehan untuk barang yang disusutkan",
    );
  }
  if (!(Number(values.usefulLifeMonths) >= 1)) {
    onIssue("usefulLifeMonths", "Isi masa manfaat, minimal 1 bulan");
  }
  if (!values.depreciationStartDate) {
    onIssue("depreciationStartDate", "Isi bulan mulai disusutkan");
  }
  if (values.acquisitionCost && salvage > cost) {
    onIssue(
      "salvageValue",
      "Nilai residu tidak boleh melebihi harga perolehan",
    );
  }
  if (Boolean(opening) !== Boolean(asOf)) {
    onIssue(
      opening ? "openingAccumulatedAsOf" : "openingAccumulatedDepreciation",
      "Isi akumulasi awal dan bulannya sekaligus",
    );
  }
  if (opening && values.acquisitionCost && Number(opening) > cost - salvage) {
    onIssue(
      "openingAccumulatedDepreciation",
      "Akumulasi awal tidak boleh melebihi harga perolehan dikurangi nilai residu",
    );
  }
  if (
    asOf &&
    values.depreciationStartDate &&
    asOf.slice(0, 7) < values.depreciationStartDate.slice(0, 7)
  ) {
    onIssue(
      "openingAccumulatedAsOf",
      "Bulan akumulasi awal tidak boleh sebelum bulan mulai disusutkan",
    );
  }
});

export const EMPTY_ASSET_FORM: AssetFormValues = {
  name: "",
  typeId: "",
  condition: "BAIK",
  serialNumber: "",
  warrantyUntil: "",
  description: "",
  roomId: "",
  bapelId: "",
  acquisitionSource: "PURCHASE",
  donorName: "",
  acquisitionDate: "",
  acquisitionCost: "",
  isDepreciable: "0",
  usefulLifeMonths: "",
  salvageValue: "",
  depreciationStartDate: "",
  openingAccumulatedDepreciation: "",
  openingAccumulatedAsOf: "",
  mainImage: [],
  detailImage: [],
};

const toAmountText = (value: string | number | null) =>
  value === null ? "" : String(Number(value));

export const toAssetForm = (asset: AssetDetail): AssetFormValues => ({
  name: asset.name,
  typeId: String(asset.type.id),
  condition: asset.condition,
  serialNumber: asset.serialNumber ?? "",
  warrantyUntil: toDateInput(asset.warrantyUntil),
  description: asset.description,
  roomId: String(asset.room.id),
  bapelId: String(asset.bapel.id),
  acquisitionSource: asset.acquisitionSource,
  donorName: asset.donorName ?? "",
  acquisitionDate: toDateInput(asset.acquisitionDate),
  acquisitionCost: toAmountText(asset.acquisitionCost),
  isDepreciable: asset.isDepreciable ? "1" : "0",
  usefulLifeMonths: toAmountText(asset.usefulLifeMonths),
  salvageValue: toAmountText(asset.salvageValue),
  depreciationStartDate: toDateInput(asset.depreciationStartDate),
  openingAccumulatedDepreciation: toAmountText(
    asset.openingAccumulatedDepreciation,
  ),
  openingAccumulatedAsOf: toDateInput(asset.openingAccumulatedAsOf),
  mainImage: asset.mainImage ? [fromServerAttachment(asset.mainImage)] : [],
  detailImage: asset.detailImage.map(fromServerAttachment),
});

const numberOrNull = (value: string) => (value ? Number(value) : null);

export const toAssetFormData = (values: AssetFormValues, isEdit: boolean) => {
  const isDepreciable = values.isDepreciable === "1";
  const depreciation = isDepreciable
    ? {
        usefulLifeMonths: numberOrNull(values.usefulLifeMonths),
        salvageValue: numberOrNull(values.salvageValue),
        depreciationStartDate: values.depreciationStartDate,
        openingAccumulatedDepreciation: numberOrNull(
          values.openingAccumulatedDepreciation,
        ),
        openingAccumulatedAsOf: values.openingAccumulatedAsOf,
      }
    : {};

  return toFormData(
    {
      name: collapseSpaces(values.name),
      description: values.description.trim(),
      serialNumber: values.serialNumber.trim(),
      condition: values.condition,
      warrantyUntil: values.warrantyUntil,
      acquisitionSource: values.acquisitionSource,
      donorName: isDonated(values.acquisitionSource)
        ? values.donorName.trim()
        : null,
      acquisitionDate: values.acquisitionDate,
      acquisitionCost: numberOrNull(values.acquisitionCost),
      isDepreciable,
      ...depreciation,
      typeId: values.typeId,
      bapelId: values.bapelId,
      roomId: values.roomId,
      keepFiles: isEdit
        ? JSON.stringify(keptAttachments(values.detailImage))
        : null,
    },
    [
      ...newAttachments(values.mainImage).map((item) => ({
        field: "mainImage",
        file: item.file,
      })),
      ...newAttachments(values.detailImage).map((item) => ({
        field: "image",
        file: item.file,
      })),
    ],
  );
};

const SERVER_FIELD_ERROR: ReadonlyArray<[RegExp, string, string?]> = [
  [/unsupported file type/i, "root", "Pilih foto JPG atau PNG."],
  [/file too large/i, "root", "Ukuran foto maksimal 10 MB."],
  [
    /unexpected field|lebih dari 4/i,
    "root",
    "Foto utama maksimal 1 dan foto detail maksimal 4.",
  ],
];

export function serverFieldError(
  message: string,
): { field: string; message: string } | null {
  for (const [pattern, field, override] of SERVER_FIELD_ERROR) {
    if (pattern.test(message)) return { field, message: override ?? message };
  }

  return null;
}

const FORM_LEVEL = /lewat siklus aset|karena sudah disusutkan/i;

// Lokasi di form ubah hanya teks baca dan field terkunci disabled: galatnya tampil di FormAlert.
export const toFormError = (error: unknown) =>
  error instanceof FetchError
    ? new FetchError(
        error.status,
        error.message,
        error.issues.map((issue) => ({
          ...issue,
          path: FORM_LEVEL.test(issue.message)
            ? "root"
            : issue.path === "keepFiles"
              ? "detailImage"
              : issue.path,
        })),
        error.code,
      )
    : error;
