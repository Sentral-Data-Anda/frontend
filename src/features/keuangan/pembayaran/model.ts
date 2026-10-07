import {
  MENU,
  FORM_SEGMENT,
  detailHref,
  menuHref,
  type MenuSlug,
} from "@/config/menu";
import { addDays, monthRange, todayJakarta } from "@/lib/date";
import { PAYMENT_STATUS_LABEL, type PaymentStatus } from "@/types/keuangan";

import type { Payment, PaymentPurpose, PostingRange } from "./types";

export const PAYMENT_LIST_PATH = menuHref(MENU.KEUANGAN, MENU.PEMBAYARAN);

export const PAYMENT_POSTING_PATH = `${PAYMENT_LIST_PATH}/posting-pembayaran`;

export const POSTING_PERSEMBAHAN_PATH = `${menuHref(MENU.KEUANGAN, MENU.JURNAL)}/posting-persembahan`;

export const KAS_MASUK_CREATE_PATH = `${menuHref(MENU.KEUANGAN, MENU.KAS_MASUK)}/${FORM_SEGMENT.create}`;

export const paymentHref = (publicId: string) =>
  detailHref(MENU.KEUANGAN, MENU.PEMBAYARAN, publicId);

export const journalHref = (publicId: string) =>
  detailHref(MENU.KEUANGAN, MENU.JURNAL, publicId);

export const persembahanHref = (code: string) =>
  detailHref(MENU.KEUANGAN, MENU.PERSEMBAHAN, code);

export { DETAIL_LINK as TEXT_LINK } from "@/components/common/display";

export const ANONYMOUS = "Anonim";

export const NO_VIEW = "Peran Anda tidak memiliki akses ke Pembayaran.";

export const EMPTY_TITLE = "Belum ada pembayaran online";

export const EMPTY_DESCRIPTION =
  "Pembayaran muncul di sini setelah jemaat membayar persembahan atau pendaftaran event lewat tautan bayarnya.";

export const ROUTE_NOTE =
  "Persembahan online masuk pembukuan lewat Posting Persembahan di menu Jurnal. Yang diposting di sini hanya pembayaran pendaftaran event.";

export const SETTLEMENT_NOTE =
  "Uang ini masih di payment gateway. Saat cair, catat pencairannya di Kas Masuk.";

export const STALE_PENDING_NOTE = "Kedaluwarsa (belum diperbarui)";

export const POSTING_NOTE =
  "Satu pembayaran pendaftaran event menjadi satu entri jurnal: masuk ke akun penampung gateway, keluar sebagai pendapatan event.";

export const NOTHING_TO_POST =
  "Tidak ada pembayaran yang bisa diposting di rentang ini.";

export const PREVIEW_REQUIRED =
  "Jalankan pratinjau dulu. Tombol posting terbuka sesudah Anda melihat apa yang akan dibukukan.";

export const NO_POSTING_ACCESS =
  "Memposting pembayaran menulis entri jurnal, jadi izinnya adalah izin membuat jurnal.";

export const PURPOSE_LABEL: Record<PaymentPurpose, string> = {
  PERSEMBAHAN: "Persembahan",
  EVENT_REGISTRATION: "Pendaftaran event",
};

export const PURPOSE_FILTER_OPTIONS = [
  { value: "", label: "Semua tujuan" },
  { value: "PERSEMBAHAN", label: PURPOSE_LABEL.PERSEMBAHAN },
  { value: "EVENT_REGISTRATION", label: PURPOSE_LABEL.EVENT_REGISTRATION },
];

export const STATUS_TABS = [
  { value: "", label: "Semua" },
  { value: "PENDING", label: PAYMENT_STATUS_LABEL.PENDING },
  { value: "PAID", label: PAYMENT_STATUS_LABEL.PAID },
  { value: "EXPIRED", label: PAYMENT_STATUS_LABEL.EXPIRED },
  { value: "FAILED", label: PAYMENT_STATUS_LABEL.FAILED },
];

export const STATUS_VARIANT = {
  PENDING: "wait",
  PAID: "success",
  EXPIRED: "neutral",
  FAILED: "due",
  CANCELLED: "neutral",
} as const satisfies Record<PaymentStatus, string>;

export const statusLabelOf = (status: PaymentStatus) =>
  PAYMENT_STATUS_LABEL[status];

export const giverOf = (payment: Pick<Payment, "jemaat" | "donorName">) =>
  payment.jemaat?.name ?? payment.donorName ?? ANONYMOUS;

export const paymentDateOf = (payment: Pick<Payment, "paidAt" | "createdAt">) =>
  payment.paidAt ?? payment.createdAt;

/** Bawaan daftar: 30 hari terakhir, sama dengan Persembahan. */
export const defaultDateRange = (today: string = todayJakarta()) => ({
  startDate: addDays(today, -29),
  endDate: today,
});

export const toPaymentApiFilters = (
  filters: Record<string, string>,
  today: string = todayJakarta(),
) => {
  const month = monthRange(filters.bulan ?? "");

  return {
    ...(month.startDate ? month : defaultDateRange(today)),
    purpose: filters.tujuan ?? "",
  };
};

/**
 * Satu-satunya angka yang dicari bendahara: uangnya sudah sampai ke buku atau
 * belum. `null` untuk yang belum lunas — belum ada apa pun untuk dibukukan.
 */
export const bookedOf = (
  payment: Pick<Payment, "status" | "persembahan" | "journal">,
) => {
  if (payment.status !== "PAID") return null;

  return payment.persembahan !== null || payment.journal !== null;
};

export const isStalePending = (
  payment: Pick<Payment, "status" | "expiredAt">,
  now: string = todayJakarta(),
) =>
  payment.status === "PENDING" &&
  payment.expiredAt !== null &&
  payment.expiredAt.slice(0, 10) < now;

type Fix = {
  href: string;
  label: string;
  menu: MenuSlug;
};

const FIX_BY_CODE: Record<string, Fix> = {
  SETTING_EMPTY: {
    href: menuHref(MENU.KEUANGAN, MENU.SETELAN_AKUNTANSI),
    label: "Buka Setelan Akuntansi",
    menu: MENU.SETELAN_AKUNTANSI,
  },
  ACCOUNT_INACTIVE: {
    href: menuHref(MENU.KEUANGAN, MENU.AKUN),
    label: "Buka Akun",
    menu: MENU.AKUN,
  },
  PERIOD_NOT_OPEN: {
    href: menuHref(MENU.KEUANGAN, MENU.PERIODE_FISKAL),
    label: "Buka Periode Fiskal",
    menu: MENU.PERIODE_FISKAL,
  },
  PERIOD_CLOSED: {
    href: menuHref(MENU.KEUANGAN, MENU.PERIODE_FISKAL),
    label: "Buka Periode Fiskal",
    menu: MENU.PERIODE_FISKAL,
  },
};

export const fixOfCode = (code: string | null | undefined): Fix | null =>
  code ? (FIX_BY_CODE[code] ?? null) : null;

export const rangeOfMonth = (bulan: string): PostingRange | null => {
  const { startDate, endDate } = monthRange(bulan);

  return startDate && endDate ? { from: startDate, to: endDate } : null;
};

export const isSameRange = (a: PostingRange | null, b: PostingRange | null) =>
  a !== null && b !== null && a.from === b.from && a.to === b.to;

export const postingStatusOf = (
  preview: { result: { posted: number } } | null,
): string | undefined => {
  if (preview === null) return PREVIEW_REQUIRED;

  return preview.result.posted === 0 ? NOTHING_TO_POST : undefined;
};
