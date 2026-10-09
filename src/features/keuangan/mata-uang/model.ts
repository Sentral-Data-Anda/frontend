import { z } from "zod";

import {
  MENU,
  createHref,
  detailHref,
  editHref,
  menuHref,
} from "@/config/menu";
import type { ListFilterSchema } from "@/hooks/use-list-params";
import { daysSince, monthRange, todayJakarta } from "@/lib/date";
import { formatDate, formatDateShort } from "@/lib/format";
import { saveListFocus } from "@/lib/list-return";
import { collapseSpaces } from "@/lib/name";

import type {
  Currency,
  CurrencyPayload,
  Rate,
  RatePayload,
  RateSource,
} from "./types";

export const MATA_UANG_LIST_PATH = menuHref(MENU.FINANCE, MENU.CURRENCY);

export const MATA_UANG_CREATE_PATH = createHref(MENU.FINANCE, MENU.CURRENCY);

export const currencyDetailHref = (code: string) =>
  detailHref(MENU.FINANCE, MENU.CURRENCY, code);

export const currencyEditHref = (code: string) =>
  editHref(MENU.FINANCE, MENU.CURRENCY, code);

export const rateCreateHref = (code: string) =>
  `${currencyDetailHref(code)}/kurs/baru`;

export const rateEditHref = (code: string, id: number) =>
  `${currencyDetailHref(code)}/kurs/${id}/ubah`;

export const rateLabelOf = (rate: Pick<Rate, "rateDate">) =>
  `Ubah kurs ${formatDate(rate.rateDate)}`;

export const saveRateFocus = (rate: Pick<Rate, "id" | "currencyCode">) =>
  saveListFocus(currencyDetailHref(rate.currencyCode), String(rate.id));

export const STALE_RATE_DAYS = 7;

export const NO_VIEW = "Peran Anda tidak memiliki akses ke Currency.";

export const RATE_SOURCE_LABEL: Record<RateSource, string> = {
  MANUAL: "Manual",
  AUTO: "Otomatis",
};

const RATE_FORMAT = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 6,
});

export const formatRate = (rate: string) =>
  `Rp ${RATE_FORMAT.format(Number(rate))}`;

export const latestRateLabel = (currency: Currency) =>
  currency.latestRate
    ? `${formatRate(currency.latestRate.rate)} · ${formatDateShort(currency.latestRate.rateDate)}`
    : null;

export const rateAgeOf = (rateDate: string, now: Date = new Date()) =>
  daysSince(rateDate, now);

export const RATE_FILTERS = {
  bulan: { api: "bulan" },
} satisfies ListFilterSchema;

export const toRateApiFilters = (
  currencyCode: string,
  filters: Record<string, string>,
) => ({ currencyCode, ...monthRange(filters.bulan ?? "") });

export const rateDeleteText = (currencyCode: string, rateDate: string) =>
  `Apakah Anda ingin menghapus kurs ${currencyCode} tanggal ${formatDate(rateDate)}? Pesanan yang sudah memakainya tidak berubah.`;

export const currencyDeleteText = (currency: Pick<Currency, "code" | "name">) =>
  `Apakah Anda ingin menghapus mata uang ${currency.code} (${currency.name})?`;

export const currencyFormSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Isi kode mata uang")
    .regex(/^[A-Z]{3}$/, "Kode mata uang harus 3 huruf, mis. USD"),
  name: z
    .string()
    .transform(collapseSpaces)
    .pipe(
      z
        .string()
        .min(1, "Isi nama mata uang")
        .max(50, "Nama mata uang maksimal 50 karakter"),
    ),
  symbol: z
    .string()
    .trim()
    .min(1, "Isi simbol mata uang")
    .max(5, "Simbol maksimal 5 karakter"),
});

export type CurrencyFormValues = z.infer<typeof currencyFormSchema>;

export const EMPTY_CURRENCY_FORM: CurrencyFormValues = {
  code: "",
  name: "",
  symbol: "",
};

export const toCurrencyCode = (value: string) =>
  value
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 3);

export const toCurrencyPayload = (
  values: CurrencyFormValues,
): CurrencyPayload => ({
  code: values.code.trim().toUpperCase(),
  name: collapseSpaces(values.name),
  symbol: values.symbol.trim(),
});

export const toCurrencyForm = (currency: Currency): CurrencyFormValues => ({
  code: currency.code,
  name: currency.name,
  symbol: currency.symbol,
});

type FieldError<T> = { field: keyof T & string; message: string } | null;

export function currencyServerError(
  message: string,
): FieldError<CurrencyFormValues> {
  if (/mata uang sudah tersedia/i.test(message)) {
    return { field: "code", message: "Kode ini sudah dipakai mata uang lain" };
  }

  return null;
}

export const rateFormSchema = z.object({
  rateDate: z
    .string()
    .min(1, "Isi tanggal kurs")
    .refine(
      (value) => value <= todayJakarta(),
      "Tanggal kurs tidak boleh di masa depan",
    ),
  rate: z
    .string()
    .min(1, "Isi kurs")
    .refine(
      (value) => value === "" || Number(value) > 0,
      "Kurs harus lebih dari 0",
    ),
});

export type RateFormValues = z.infer<typeof rateFormSchema>;

export const emptyRateForm = (): RateFormValues => ({
  rateDate: todayJakarta(),
  rate: "",
});

export const trimRate = (rate: string) =>
  rate.includes(".") ? rate.replace(/\.?0+$/, "") : rate;

export const toRatePayload = (
  values: RateFormValues,
  currencyCode: string,
): RatePayload => ({
  currencyCode,
  rateDate: values.rateDate,
  rate: values.rate,
  source: "MANUAL",
});

export const toRateForm = (rate: Rate): RateFormValues => ({
  rateDate: rate.rateDate.slice(0, 10),
  rate: trimRate(rate.rate),
});

export function rateServerError(message: string): FieldError<RateFormValues> {
  if (/kurs untuk tanggal dan sumber ini sudah ada/i.test(message)) {
    return {
      field: "rateDate",
      message: "Kurs tanggal ini sudah ada. Ubah kurs itu di daftar kurs.",
    };
  }

  return null;
}
