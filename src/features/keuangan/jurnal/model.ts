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

export { DETAIL_LINK as TEXT_LINK } from "@/components/common/display";

export const JURNAL_LIST_PATH = menuHref(MENU.KEUANGAN, MENU.JURNAL);

export const JURNAL_CREATE_PATH = createHref(MENU.KEUANGAN, MENU.JURNAL);

export const POSTING_PERSEMBAHAN_PATH = `${JURNAL_LIST_PATH}/posting-persembahan`;

export const POSTING_ASET_PATH = `${JURNAL_LIST_PATH}/posting-aset`;

export const POSTING_PENGADAAN_PATH = `${JURNAL_LIST_PATH}/posting-pengadaan`;

export const POSTING_PERSEDIAAN_PATH = `${JURNAL_LIST_PATH}/posting-persediaan`;

/**
 * Keempat posting otomatis, dan menu yang menyediakan dokumennya.
 *
 * Satu daftar, bukan satu tautan: tiga layar ini sudah ada rutenya sejak
 * fase-fase sebelumnya dan tidak satu pun pernah ditautkan dari mana-mana —
 * jadi satu-satunya cara mencapainya adalah mengetik URL-nya. Rute yang tidak
 * punya tautan sama dengan rute yang tidak ada.
 */
export const POSTING_LINKS = [
  { key: "persembahan", href: POSTING_PERSEMBAHAN_PATH, label: "Persembahan" },
  { key: "aset", href: POSTING_ASET_PATH, label: "Aset sumbangan" },
  { key: "pengadaan", href: POSTING_PENGADAAN_PATH, label: "Pengadaan" },
  { key: "persediaan", href: POSTING_PERSEDIAAN_PATH, label: "Persediaan" },
] as const;

export const journalHref = (publicId: string) =>
  detailHref(MENU.KEUANGAN, MENU.JURNAL, publicId);

export const journalEditHref = (publicId: string) =>
  editHref(MENU.KEUANGAN, MENU.JURNAL, publicId);

export const accountHref = (code: string) =>
  detailHref(MENU.KEUANGAN, MENU.AKUN, code);

export const PERIODE_FISKAL_PATH = menuHref(MENU.KEUANGAN, MENU.PERIODE_FISKAL);

export const persembahanHref = (code: string) =>
  detailHref(MENU.KEUANGAN, MENU.PERSEMBAHAN, code);

export const asetHref = (code: string) =>
  detailHref(MENU.INVENTARIS, MENU.BARANG, code);

// Penolakan mutasi persediaan menyebut kode BARANGNYA, bukan kode mutasinya:
// sebuah mutasi tidak punya kode sendiri — dia baris di kartu stok — dan yang
// harus diperbaiki memang harga barangnya.
export const barangPersediaanHref = (code: string) =>
  detailHref(MENU.INVENTARIS, MENU.BARANG_PERSEDIAAN, code);

// Faktur dan pembayaran yang ditolak sama-sama menyebut KODE FAKTUR sebagai
// subjeknya, jadi satu tautan cukup untuk keduanya.
export const fakturHref = (code: string) =>
  detailHref(MENU.PENGADAAN, MENU.FAKTUR_SUPPLIER, code);

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
  "Posting otomatis mengubah dokumen yang sudah dicatat menjadi entri jurnal, satu dokumen satu entri. Yang pernah diposting dilewati, jadi menjalankannya lagi aman.";

export const POSTING_ASET_NOTE =
  "Hanya aset dari sumbangan dan hibah. Aset yang dibeli masuk buku bersama fakturnya — membukukannya di sini juga berarti menghitung pembelian yang sama dua kali.";

export const POSTING_PENGADAAN_NOTE =
  "Faktur supplier dan pembayarannya dibukukan bersama, fakturnya lebih dulu. Sebuah pembayaran mendebit hutang yang dikredit fakturnya, jadi membukukan pembayaran lebih dulu membuat kewajibannya minus.";

export const NOTHING_TO_POST_PENGADAAN =
  "Tidak ada faktur atau pembayaran yang bisa diposting di rentang ini.";

export const POSTING_PERSEDIAAN_NOTE =
  "Pemakaian, pembuangan, sumbangan barang, dan koreksi stok opname. Penerimaan barang dan beli langsung tidak lewat sini: uangnya sudah dibawa faktur suppliernya atau Kas Keluar.";

export const NOTHING_TO_POST_PERSEDIAAN =
  "Tidak ada mutasi persediaan yang bisa diposting di rentang ini.";

export const NOTHING_TO_POST_ASET =
  "Tidak ada aset sumbangan yang bisa diposting di rentang ini.";

export const NOTHING_TO_POST =
  "Tidak ada persembahan yang bisa diposting di rentang ini.";

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
  // Tanpa baris ini kolom Perbaikan kosong untuk setiap aset yang ditolak, dan
  // kolom itu ada justru untuk mengatakan ke mana memperbaikinya. Terlihat saat
  // meninjau layarnya, bukan saat membaca kodenya.
  ASSET_NO_COST: {
    href: menuHref(MENU.INVENTARIS, MENU.BARANG),
    label: "Buka Barang",
    menu: MENU.BARANG,
  },
  // Pembayaran yang fakturnya belum dibukukan: yang harus diperbaiki adalah
  // fakturnya, bukan pembayarannya, jadi tautannya ke Faktur Supplier.
  INVOICE_NOT_POSTED: {
    href: menuHref(MENU.PENGADAAN, MENU.FAKTUR_SUPPLIER),
    label: "Buka Faktur Supplier",
    menu: MENU.FAKTUR_SUPPLIER,
  },
  // Mutasi tanpa nilai: yang diperbaiki adalah harga BARANGNYA, bukan
  // mutasinya — sebuah mutasi tidak bisa diubah, dan memang tidak seharusnya.
  STOCK_NO_COST: {
    href: menuHref(MENU.INVENTARIS, MENU.BARANG_PERSEDIAAN),
    label: "Buka Barang Persediaan",
    menu: MENU.BARANG_PERSEDIAAN,
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

/**
 * Kalimat di bawah tombol: kenapa Posting masih mati.
 *
 * `nothing` dilewatkan pemanggil, bukan dipaku di sini. Dipaku, layar Aset
 * memakai tombol yang sama dan berbunyi "tidak ada persembahan" — terlihat
 * saat meninjau layarnya, bukan saat membaca kodenya.
 */
export const postingStatusOf = (
  preview: { result: { posted: number } } | null,
  nothing: string = NOTHING_TO_POST,
): string | undefined => {
  if (preview === null) return PREVIEW_REQUIRED;

  return preview.result.posted === 0 ? nothing : undefined;
};
