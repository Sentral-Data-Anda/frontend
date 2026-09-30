import { z } from "zod";

import {
  MENU,
  createHref,
  detailHref,
  editHref,
  menuHref,
  type MenuSlug,
} from "@/config/menu";
import { FetchError } from "@/lib/api/fetcher";
import { monthRange, toDateInput, todayJakarta } from "@/lib/date";
import { balanceOf } from "@/lib/number";
import { JOURNAL_STATUS_LABEL, type JournalStatus } from "@/types/keuangan";

import {
  JOURNAL_SOURCE_LABEL,
  type JournalEntry,
  type JournalEntryDetail,
  type JournalPayload,
  type PostingRange,
  type ReversePayload,
} from "./types";

export const MAX_LINES = 50;

export const DESCRIPTION_MAX = 250;

export const TEXT_LINK =
  "text-primary cursor-pointer rounded-sm underline decoration-primary/30 underline-offset-4 transition-colors hover:decoration-primary focus-visible:decoration-primary";

export const JURNAL_LIST_PATH = menuHref(MENU.KEUANGAN, MENU.JURNAL);

export const JURNAL_CREATE_PATH = createHref(MENU.KEUANGAN, MENU.JURNAL);

export const POSTING_PERSEMBAHAN_PATH = `${JURNAL_LIST_PATH}/posting-persembahan`;

export const journalHref = (publicId: string) =>
  detailHref(MENU.KEUANGAN, MENU.JURNAL, publicId);

export const journalEditHref = (publicId: string) =>
  editHref(MENU.KEUANGAN, MENU.JURNAL, publicId);

export const accountHref = (code: string) =>
  detailHref(MENU.KEUANGAN, MENU.AKUN, code);

export const PERIODE_FISKAL_PATH = menuHref(MENU.KEUANGAN, MENU.PERIODE_FISKAL);

export const persembahanHref = (code: string) =>
  detailHref(MENU.KEUANGAN, MENU.PERSEMBAHAN, code);

export const monthListHref = (year: number, month: number) =>
  `${JURNAL_LIST_PATH}?bulan=${year}-${String(month).padStart(2, "0")}`;

export const NO_VIEW = "Peran Anda tidak memiliki akses ke Jurnal.";

export const EMPTY_TITLE = "Belum ada entri jurnal";

export const EMPTY_DESCRIPTION =
  "Saldo awal gereja dimasukkan di sini. Selama buku belum punya entri, tidak ada laporan yang bisa dibaca.";

export const NO_ACCOUNT_TITLE = "Belum ada akun";

export const NO_ACCOUNT_DESCRIPTION =
  "Entri jurnal memilih akun per baris, jadi daftar akun harus ada lebih dulu.";

export const POSTING_NOTE =
  "Persembahan diposting per baris: satu persembahan menjadi satu entri jurnal dengan dua baris.";

export const PREVIEW_REQUIRED =
  "Jalankan pratinjau dulu. Tombol posting terbuka sesudah Anda melihat apa yang akan dibukukan.";

export const DELETE_TEXT =
  "Draf ini akan dihapus permanen beserta seluruh barisnya, dan nomor kodenya hangus. Tidak ada cara mengembalikannya.";

export const POST_TEXT =
  "Sesudah diposting, entri ini masuk ke buku dan tidak bisa diubah atau dihapus lagi — hanya dibalik.";

export const STATUS_TABS = [
  { value: "", label: "Semua" },
  { value: "DRAFT", label: "Draf" },
  { value: "POSTED", label: "Diposting" },
  { value: "REVERSED", label: "Dibalik" },
] satisfies { value: "" | JournalStatus; label: string }[];

export const STATUS_VARIANT = {
  DRAFT: "draft",
  POSTED: "success",
  REVERSED: "neutral",
} as const satisfies Record<JournalStatus, string>;

const monthFormat = new Intl.DateTimeFormat("id-ID", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export const periodLabelOf = (period: { year: number; month: number }) =>
  monthFormat.format(new Date(Date.UTC(period.year, period.month - 1, 1)));

export const statusLabelOf = (status: JournalStatus) =>
  JOURNAL_STATUS_LABEL[status];

export const sourceLabelOf = (entry: Pick<JournalEntry, "sourceType">) =>
  JOURNAL_SOURCE_LABEL[entry.sourceType];

export function toJournalApiFilters(filters: Record<string, string>) {
  const bulan = filters.bulan ?? "";

  return {
    year: bulan ? bulan.slice(0, 4) : todayJakarta().slice(0, 4),
    month: bulan ? String(Number(bulan.slice(5, 7))) : "",
    accountId: filters.akun ?? "",
  };
}

// Setiap penolakan dan setiap galat tulis dicabangkan lewat `code` yang stabil.
// Teks Indonesia milik server dan boleh berubah; kode tidak.
type Fix = {
  href: string;
  label: string;
  menu: MenuSlug;
};

const FIX_BY_CODE: Record<string, Fix> = {
  OFFERING_TYPE_NO_ACCOUNT: {
    href: menuHref(MENU.KEUANGAN, MENU.TIPE_PERSEMBAHAN),
    label: "Buka Tipe Persembahan",
    menu: MENU.TIPE_PERSEMBAHAN,
  },
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

export const PERIOD_CLOSED_UNDER_LOCK = "PERIOD_CLOSED_UNDER_LOCK";

export const isReloadAdvised = (error: unknown) =>
  error instanceof FetchError && error.code === PERIOD_CLOSED_UNDER_LOCK;

export const RELOAD_ADVICE =
  "Bulannya baru saja ditutup dan tidak ada yang tersimpan. Muat ulang halaman ini, lalu coba lagi.";

const lineSchema = z.object({
  accountId: z.string(),
  debit: z.string(),
  credit: z.string(),
  description: z.string(),
});

export type JournalFormLine = z.infer<typeof lineSchema>;

export const isLineFilled = (line: JournalFormLine) =>
  Boolean(line.accountId || line.debit || line.credit);

export const journalFormSchema = z
  .object({
    entryDate: z.string(),
    description: z.string(),
    lines: z.array(lineSchema),
  })
  .superRefine((values, ctx) => {
    const addIssue = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: "custom", path, message });
    const description = values.description.trim();

    if (!values.entryDate) addIssue(["entryDate"], "Isi tanggal entri");
    else if (values.entryDate > todayJakarta()) {
      addIssue(["entryDate"], "Tanggal entri tidak boleh di masa depan");
    }

    if (!description) addIssue(["description"], "Isi keterangan");
    else if (description.length > DESCRIPTION_MAX) {
      addIssue(
        ["description"],
        `Keterangan maksimal ${DESCRIPTION_MAX} karakter`,
      );
    }

    if (values.lines.length < 2) {
      addIssue(["lines"], "Entri jurnal perlu minimal 2 baris");
    } else if (values.lines.length > MAX_LINES) {
      addIssue(["lines"], `Maksimal ${MAX_LINES} baris per entri`);
    }

    values.lines.forEach((line, index) => {
      const at = (field: keyof JournalFormLine) => ["lines", index, field];

      const isDebit = Number(line.debit) > 0;
      const isCredit = Number(line.credit) > 0;

      if (!line.accountId) addIssue(at("accountId"), "Pilih akun");
      if (isDebit && isCredit) {
        addIssue(at("debit"), "Isi Debit saja atau Kredit saja");
      } else if (!isDebit && !isCredit) {
        addIssue(at("debit"), "Isi Debit atau Kredit");
      }
      if (line.description.length > DESCRIPTION_MAX) {
        addIssue(
          at("description"),
          `Keterangan maksimal ${DESCRIPTION_MAX} karakter`,
        );
      }
    });
  });

export type JournalFormValues = z.infer<typeof journalFormSchema>;

export const newJournalLine = (): JournalFormLine => ({
  accountId: "",
  debit: "",
  credit: "",
  description: "",
});

export const emptyJournalForm = (): JournalFormValues => ({
  entryDate: todayJakarta(),
  description: "",
  lines: [newJournalLine(), newJournalLine()],
});

const toAmount = (value: string) => {
  const amount = Number(value);

  return amount > 0 ? String(amount) : "";
};

export const toJournalForm = (
  entry: JournalEntryDetail,
): JournalFormValues => ({
  entryDate: toDateInput(entry.entryDate),
  description: entry.description,
  lines: entry.lines.map((line) => ({
    accountId: String(line.accountId),
    debit: toAmount(line.debit),
    credit: toAmount(line.credit),
    description: line.description ?? "",
  })),
});

export const toJournalPayload = (
  values: JournalFormValues,
): JournalPayload => ({
  entryDate: values.entryDate,
  description: values.description.trim(),
  lines: values.lines.map((line) => ({
    accountId: Number(line.accountId),
    debit: line.debit || "0",
    credit: line.credit || "0",
    ...(line.description.trim()
      ? { description: line.description.trim() }
      : {}),
  })),
});

export const entryBalanceOf = (entry: Pick<JournalEntryDetail, "lines">) =>
  balanceOf(
    entry.lines.map((line) => ({ debit: line.debit, credit: line.credit })),
  );

export const isEditable = (entry: Pick<JournalEntryDetail, "status">) =>
  entry.status === "DRAFT";

export const isReversible = (
  entry: Pick<JournalEntryDetail, "status" | "isReversal" | "reversedBy">,
) =>
  entry.status === "POSTED" && !entry.isReversal && entry.reversedBy === null;

export const postBlockReasonOf = (entry: JournalEntryDetail) => {
  const balance = entryBalanceOf(entry);

  if (entry.lines.length < 2) return "Entri jurnal perlu minimal 2 baris.";
  if (!balance.isBalanced) {
    return "Debit dan kredit belum seimbang. Selisihnya harus nol dan totalnya lebih dari nol.";
  }

  return null;
};

export const reverseFormSchema = z.object({
  entryDate: z.string().min(1, "Isi tanggal pembalikan"),
  description: z
    .string()
    .trim()
    .min(1, "Isi keterangan pembalikan")
    .max(DESCRIPTION_MAX, `Keterangan maksimal ${DESCRIPTION_MAX} karakter`),
});

export type ReverseFormValues = z.infer<typeof reverseFormSchema>;

export const emptyReverseForm = (
  entry: Pick<JournalEntryDetail, "code">,
): ReverseFormValues => ({
  entryDate: todayJakarta(),
  description: `Pembalikan ${entry.code}`,
});

export const toReversePayload = (
  values: ReverseFormValues,
): ReversePayload => ({
  entryDate: values.entryDate,
  description: values.description.trim(),
});

export const REVERSE_NOTE =
  "Tanggal pembalikan menentukan bulan bukunya. Bulan entri aslinya biasanya sudah ditutup, jadi baliklah di bulan tempat kesalahannya ditemukan.";

export const rangeOfMonth = (bulan: string): PostingRange | null => {
  const { startDate, endDate } = monthRange(bulan);

  return startDate && endDate ? { from: startDate, to: endDate } : null;
};

export const isSameRange = (a: PostingRange | null, b: PostingRange | null) =>
  a !== null && b !== null && a.from === b.from && a.to === b.to;
