import { z } from "zod";

import { MENU, detailHref, menuHref } from "@/config/menu";
import { monthOptions, todayJakarta } from "@/lib/date";
import { formatAmountCents } from "@/lib/format";

import {
  RUN_STATUS_LABEL,
  type Run,
  type RunAction,
  type RunDetail,
  type RunPayload,
} from "./types";

export const PENYUSUTAN_LIST_PATH = menuHref(MENU.INVENTARIS, MENU.PENYUSUTAN);

export const runHref = (code: string) =>
  detailHref(MENU.INVENTARIS, MENU.PENYUSUTAN, code);

export const assetHref = (code: string) =>
  detailHref(MENU.INVENTARIS, MENU.BARANG, code);

const PERIOD_FORMAT = new Intl.DateTimeFormat("id-ID", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export const periodLabel = (year: number, month: number) =>
  PERIOD_FORMAT.format(new Date(Date.UTC(year, month - 1, 1)));

export const isCalculated = (run: Pick<Run, "updatedAt">) =>
  run.updatedAt !== null;

export const runStatusText = (run: Pick<Run, "status" | "updatedAt">) =>
  run.status === "DRAFT" && !isCalculated(run)
    ? `${RUN_STATUS_LABEL.DRAFT} · belum dihitung`
    : RUN_STATUS_LABEL[run.status];

export const STATUS_PARAM: Record<string, string> = {
  draf: "DRAFT",
  diposting: "POSTED",
};

export const STATUS_FILTER_OPTIONS = [
  { value: "", label: "Semua" },
  { value: "draf", label: RUN_STATUS_LABEL.DRAFT },
  { value: "diposting", label: RUN_STATUS_LABEL.POSTED },
];

export function yearOptions(today: string = todayJakarta()) {
  const year = Number(today.slice(0, 4));

  return [
    { value: "", label: "Semua tahun" },
    ...Array.from({ length: 6 }, (_, index) => {
      const value = String(year - index);

      return { value, label: value };
    }),
  ];
}

export const periodOptions = (today: string = todayJakarta()) =>
  monthOptions(today).slice(1);

const toPeriodValue = (year: number, month: number) =>
  `${year}-${String(month).padStart(2, "0")}`;

export function defaultPeriod(
  latest: Pick<Run, "year" | "month"> | undefined,
  today: string = todayJakarta(),
) {
  const options = periodOptions(today);
  const current = options[0].value;

  if (!latest) return current;

  const next =
    latest.month === 12
      ? toPeriodValue(latest.year + 1, 1)
      : toPeriodValue(latest.year, latest.month + 1);

  return options.some((option) => option.value === next) ? next : current;
}

export const runFormSchema = z.object({
  period: z.string().regex(/^\d{4}-\d{2}$/, "Periode wajib dipilih"),
});

export type RunFormValues = z.infer<typeof runFormSchema>;

export const toRunPayload = (values: RunFormValues): RunPayload => ({
  year: Number(values.period.slice(0, 4)),
  month: Number(values.period.slice(5, 7)),
});

export const recalculateText = (period: string) =>
  `Apakah Anda ingin menghitung ulang penyusutan ${period}? Hasil sebelumnya diganti dengan data barang terbaru.`;

export const EMPTY_POST_NOTE =
  "Periode tanpa barang disusutkan diposting tanpa jurnal.";

export const postText = (
  period: string,
  run: Pick<RunDetail, "totalAmount" | "entries">,
) =>
  run.entries.length === 0
    ? `Apakah Anda ingin memposting penyusutan ${period}? ${EMPTY_POST_NOTE}`
    : `Apakah Anda ingin memposting penyusutan ${period} sebesar ${formatAmountCents(run.totalAmount)}? Jurnal dibuat otomatis dan tidak bisa dibatalkan.`;

export const DELETE_TEXT =
  "Apakah Anda ingin menghapus periode ini? Periode bisa dibuka lagi.";

export const GAP_NOTE = {
  title: "Jurnal penyusutan mencatat beban dan akumulasi.",
  message:
    "Nilai perolehan barang belum dijurnal otomatis; pastikan saldo awal aset sudah dicatat bendahara di Jurnal.",
};

const ACCOUNT_ERROR = /Setelan Akuntansi|^Akun .* Tidak Aktif$/i;

const FAILED_TITLE: Record<RunAction | "delete", string> = {
  calculate: "Penyusutan belum dihitung.",
  post: "Penyusutan belum diposting.",
  delete: "Periode belum terhapus.",
};

export const actionErrorTitle = (
  action: RunAction | "delete",
  message: string,
) =>
  action === "post" && ACCOUNT_ERROR.test(message)
    ? "Penyusutan belum diposting. Atur akunnya di Keuangan › Setelan Akuntansi, lalu posting lagi."
    : FAILED_TITLE[action];
