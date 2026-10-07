import { z } from "zod";

import { MENU, detailHref, menuHref } from "@/config/menu";
import { todayJakarta } from "@/lib/date";
import { formatDate, formatNumber } from "@/lib/format";
import { PERIOD_STATUS_LABEL, type PeriodStatus } from "@/types/keuangan";

import type { FiscalPeriod, FiscalPeriodDetail } from "./types";

export const PERIODE_FISKAL_LIST_PATH = menuHref(
  MENU.KEUANGAN,
  MENU.PERIODE_FISKAL,
);

export const periodHref = (id: string) =>
  detailHref(MENU.KEUANGAN, MENU.PERIODE_FISKAL, id);

const JURNAL_PATH = menuHref(MENU.KEUANGAN, MENU.JURNAL);

export const draftJournalHref = (
  period: Pick<FiscalPeriod, "year" | "month">,
) => `${JURNAL_PATH}?status=DRAFT&year=${period.year}&month=${period.month}`;

export const POSTING_PERSEMBAHAN_PATH = `${JURNAL_PATH}/posting-persembahan`;

export const APPROVED_EXPENSE_PATH = `${menuHref(MENU.KEUANGAN, MENU.KAS_KELUAR)}?status=APPROVED`;

export { DETAIL_LINK as LINK_CLASS } from "@/components/common/display";

export const PERIOD_STATUS_VARIANT: Record<
  PeriodStatus,
  "success" | "neutral"
> = {
  OPEN: "success",
  CLOSED: "neutral",
};

export const statusLabel = (status: PeriodStatus) =>
  PERIOD_STATUS_LABEL[status];

const monthOf = (text: string) => text.slice(text.indexOf(" ") + 1);

export function rangeText(period: Pick<FiscalPeriod, "startDate" | "endDate">) {
  const start = formatDate(period.startDate);
  const end = formatDate(period.endDate);

  return monthOf(start) === monthOf(end)
    ? `${start.slice(0, start.indexOf(" "))} – ${end}`
    : `${start} – ${end}`;
}

export const draftText = (count: number) => `${formatNumber(count)} draf`;

export const EMPTY_TITLE = "Belum ada periode fiskal";

export const EMPTY_DESCRIPTION =
  "Buka satu tahun untuk mulai membukukan. Tanpa periode, tidak ada entri jurnal yang bisa ditulis.";

export const emptyYearDescription = (year: number) =>
  `Tahun ${year} belum dibuka. Membukanya membuat 12 periode bulanan sekaligus.`;

export function yearTabOptions(
  years: readonly number[],
  today: string = todayJakarta(),
) {
  const current = Number(today.slice(0, 4));
  const unique = [...new Set([current, ...years])].sort((a, b) => b - a);

  return unique.map((year) => ({ value: String(year), label: String(year) }));
}

export function yearOptions(today: string = todayJakarta()) {
  const current = Number(today.slice(0, 4));

  return [current - 1, current, current + 1].map((year) => ({
    value: String(year),
    label: String(year),
  }));
}

export const openYearSchema = z.object({
  year: z.string().regex(/^\d{4}$/, "Tahun wajib dipilih"),
});

export type OpenYearValues = z.infer<typeof openYearSchema>;

export const reopenSchema = z.object({
  reopenReason: z
    .string()
    .trim()
    .min(1, "Alasan wajib diisi")
    .max(250, "Alasan maksimal 250 karakter"),
});

export type ReopenValues = z.infer<typeof reopenSchema>;

export const openYearText = (year: string) =>
  `Membuka tahun ${year} membuat 12 periode bulanan sekaligus.`;

const countText = (period: FiscalPeriodDetail) =>
  [
    period.draftCount > 0
      ? `${formatNumber(period.draftCount)} entri draf`
      : "",
    period.unpostedPersembahanCount
      ? `${formatNumber(period.unpostedPersembahanCount)} persembahan belum diposting`
      : "",
    period.unpaidApprovedExpenseCount
      ? `${formatNumber(period.unpaidApprovedExpenseCount)} kas keluar disetujui belum dibayar`
      : "",
  ].filter(Boolean);

export function closeText(period: FiscalPeriodDetail) {
  const pending = countText(period);
  const question = `Apakah Anda ingin menutup buku ${period.label}? Sesudah ditutup, tidak ada entri jurnal yang bisa ditulis ke bulan ini.`;

  return pending.length === 0
    ? question
    : `${question} Bulan ini masih punya ${pending.join(", ")}.`;
}

export const reopenText = (label: string) =>
  `Buku ${label} akan dibuka kembali. Tulis alasannya.`;

export const CLOSE_NOTE =
  "Menutup buku mengunci bulan ini; membukanya lagi selalu memakai alasan yang tersimpan.";

export const yearInMessage = (message: string) =>
  /\b(20\d{2})\b/.exec(message)?.[1] ?? null;

export const listYearHref = (year: string) =>
  `${PERIODE_FISKAL_LIST_PATH}?tahun=${year}`;

export const CLOSE_FAILED_TITLE = "Buku belum ditutup.";

export const REOPEN_FAILED_TITLE = "Buku belum dibuka kembali.";
