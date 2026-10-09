import { z } from "zod";

import type { SelectOption } from "@/components/common/control";
import {
  FORM_SEGMENT,
  MENU,
  detailHref,
  menuHref,
  type MenuSlug,
} from "@/config/menu";
import { FetchError } from "@/lib/api/fetcher";
import { addDays, monthRange, todayJakarta } from "@/lib/date";
import { formatAmount, formatRupiah } from "@/lib/format";
import { collapseSpaces } from "@/lib/name";
import { sumAmounts } from "@/lib/number";
import {
  PERSEMBAHAN_STATUS_LABEL,
  RECEIVE_METHOD_LABEL,
  type PersembahanStatus,
} from "@/types/keuangan";

import type { OfferingTypeOption, PersembahanBatchPayload } from "./types";

export const PERSEMBAHAN_LIST_PATH = menuHref(MENU.FINANCE, MENU.PERSEMBAHAN);

export const KOLEKTE_PATH = `${PERSEMBAHAN_LIST_PATH}/${FORM_SEGMENT.kolekte}`;

export const PERSEMBAHAN_CREATE_PATH = `${PERSEMBAHAN_LIST_PATH}/${FORM_SEGMENT.create}`;

export const persembahanHref = (code: string) =>
  detailHref(MENU.FINANCE, MENU.PERSEMBAHAN, code);

// Rute Jurnal hanya menerima publicId; kodenya untuk dibaca, bukan dirute.
export const journalHref = (publicId: string) =>
  detailHref(MENU.FINANCE, MENU.JOURNAL_ENTRY, publicId);

export const PERIODE_FISKAL_PATH = menuHref(MENU.FINANCE, MENU.FISCAL_PERIOD);

export const TIPE_PERSEMBAHAN_PATH = menuHref(
  MENU.FINANCE,
  MENU.TIPE_PERSEMBAHAN,
);

export const SETELAN_AKUNTANSI_PATH = menuHref(
  MENU.FINANCE,
  MENU.ACCOUNTING_SETTING,
);

export const AKUN_PATH = menuHref(MENU.FINANCE, MENU.CHART_OF_ACCOUNT);

export const KAS_MASUK_CREATE_PATH = `${menuHref(MENU.FINANCE, MENU.KAS_MASUK)}/${FORM_SEGMENT.create}`;

export const NO_VIEW = "Peran Anda tidak memiliki akses ke Persembahan.";

export const EMPTY_TITLE = "Belum ada persembahan";

export const EMPTY_DESCRIPTION =
  "Catat kolekte tiap Minggu di satu form: satu tanggal, satu cara terima, dan satu baris per amplop.";

export const ANONYMOUS = "Anonim";

export const RECORDER = "Nama pencatat";

export const GATEWAY_NOTE =
  "Persembahan lewat pembayaran online ditulis oleh sistem pembayaran dan tidak bisa dicatat di sini.";

export const POSTED_NOTE =
  "Persembahan yang sudah diposting tidak dicatat lagi di Kas Masuk.";

export const PERIOD_NOTE =
  "Bulan yang dimaksud persembahan ini, bukan tanggal uangnya diterima.";

export const RECEIVED_BY_NOTE =
  "Yang menghitung dan memegang uangnya. Dikosongkan berarti nama pencatat.";

export const COUNT_CHECK_LABEL = "Jumlah hasil hitung fisik (Rp)";

export const COUNT_CHECK_NOTE =
  "Alat bantu hitung. Angka ini tidak dikirim ke server.";

export const MAX_ITEMS = 100;

export const VOID_REASON_MAX = 250;

export const PERSEMBAHAN_STATUS_VARIANT: Record<
  PersembahanStatus,
  "success" | "destructive"
> = {
  ACTIVE: "success",
  VOID: "destructive",
};

export const STATUS_FILTER_OPTIONS: SelectOption[] = [
  { value: "", label: "Semua status" },
  ...Object.entries(PERSEMBAHAN_STATUS_LABEL).map(([value, label]) => ({
    value,
    label,
  })),
];

export const METHOD_FILTER_OPTIONS: SelectOption[] = [
  { value: "", label: "Semua cara" },
  ...Object.entries(RECEIVE_METHOD_LABEL).map(([value, label]) => ({
    value,
    label,
  })),
];

export const POSTED_FILTER_OPTIONS: SelectOption[] = [
  { value: "", label: "Semua" },
  { value: "1", label: "Sudah diposting" },
  { value: "0", label: "Belum diposting" },
];

/**
 * Cara uang bisa benar-benar tiba LEWAT TANGAN.
 *
 * PAYMENT_GATEWAY tidak ada di sini dan tidak boleh ditambahkan: baris gateway
 * ditulis webhook dari sebuah `Payment` yang sudah dikonfirmasi penyedia, dan
 * menerimanya di sini akan membuat ada gift gateway tanpa pembayaran di
 * belakangnya. QRIS JUSTRU ada, karena QRIS statis gereja tidak punya
 * `Payment` sama sekali — tidak ada yang memberi tahu sistem ini saat
 * seseorang memindai papan di pintu.
 */
export const RECEIVE_METHOD_OPTIONS: SelectOption[] = [
  { value: "TUNAI", label: RECEIVE_METHOD_LABEL.TUNAI },
  { value: "TRANSFER", label: RECEIVE_METHOD_LABEL.TRANSFER },
  { value: "QRIS", label: RECEIVE_METHOD_LABEL.QRIS },
];

/** Bawaan daftar: 30 hari terakhir, yang dilihat bendahara tiap Minggu. */
export const defaultDateRange = (today: string = todayJakarta()) => ({
  startDate: addDays(today, -29),
  endDate: today,
});

export const toPersembahanApiFilters = (
  filters: Record<string, string>,
  today: string = todayJakarta(),
) => {
  const month = monthRange(filters.bulan ?? "");
  const range = month.startDate ? month : defaultDateRange(today);

  return {
    ...range,
    typePersembahanId: filters.tipe ?? "",
    receiveMethod: filters.cara ?? "",
    isPosted: filters.posting ?? "",
  };
};

export const giverOf = (row: {
  jemaat: { name: string } | null;
  donorName: string | null;
}) => row.jemaat?.name ?? row.donorName ?? ANONYMOUS;

const monthFormat = new Intl.DateTimeFormat("id-ID", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export const periodLabel = (period: string | null) =>
  period ? monthFormat.format(new Date(period)) : null;

export const totalsSubtitle = (count: number, total: string) =>
  `${count} persembahan · Total ${formatAmount(total)}`;

// ---------------------------------------------------------------------------
// Galat server yang menyebut akun, setelan, tipe, atau periode: setiap satunya
// dirender dengan tautan ke layar yang memperbaikinya.

type FixLink = { menu: MenuSlug; href: string; label: string };

const FIX_BY_CODE: Record<string, FixLink> = {
  PERIOD_NOT_OPEN: {
    menu: MENU.FISCAL_PERIOD,
    href: PERIODE_FISKAL_PATH,
    label: "Buka periode fiskal",
  },
  PERIOD_CLOSED: {
    menu: MENU.FISCAL_PERIOD,
    href: PERIODE_FISKAL_PATH,
    label: "Lihat periode fiskal",
  },
  PERIOD_CLOSED_UNDER_LOCK: {
    menu: MENU.FISCAL_PERIOD,
    href: PERIODE_FISKAL_PATH,
    label: "Lihat periode fiskal",
  },
  OFFERING_TYPE_NO_ACCOUNT: {
    menu: MENU.TIPE_PERSEMBAHAN,
    href: TIPE_PERSEMBAHAN_PATH,
    label: "Lengkapi tipe persembahan",
  },
  SETTING_EMPTY: {
    menu: MENU.ACCOUNTING_SETTING,
    href: SETELAN_AKUNTANSI_PATH,
    label: "Isi setelan akuntansi",
  },
  ACCOUNT_INACTIVE: {
    menu: MENU.CHART_OF_ACCOUNT,
    href: AKUN_PATH,
    label: "Lihat akun",
  },
};

export const fixLinkOf = (error: unknown): FixLink | null =>
  error instanceof FetchError && error.code
    ? (FIX_BY_CODE[error.code] ?? null)
    : null;

// ---------------------------------------------------------------------------
// Form. Header + baris; "catat satu" adalah form yang sama dengan satu baris.

const itemSchema = z.object({
  typePersembahanId: z.string(),
  typeName: z.string(),
  hasPeriod: z.boolean(),
  requiresJemaat: z.boolean(),
  jemaatId: z.string(),
  jemaatName: z.string(),
  period: z.string(),
  amount: z.string(),
  donorName: z.string(),
});

export const persembahanFormSchema = z
  .object({
    receivedDate: z.string(),
    receiveMethod: z.enum(["TUNAI", "TRANSFER"]),
    ibadahId: z.string(),
    receivedBy: z.string(),
    countCheck: z.string(),
    items: z.array(itemSchema),
  })
  .superRefine((values, ctx) => {
    const addIssue = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: "custom", path, message });

    if (!values.receivedDate) {
      addIssue(["receivedDate"], "Isi tanggal terima");
    } else if (values.receivedDate > todayJakarta()) {
      addIssue(["receivedDate"], "Tanggal terima tidak boleh di masa depan");
    }

    if (values.items.length === 0) {
      addIssue(["items"], "Tambahkan minimal satu baris persembahan");
    }

    if (values.items.length > MAX_ITEMS) {
      addIssue(["items"], `Satu kolekte maksimal ${MAX_ITEMS} baris`);
    }

    values.items.forEach((item, index) => {
      if (!item.typePersembahanId) {
        addIssue(["items", index, "typePersembahanId"], "Pilih tipe");
      }

      if (item.requiresJemaat && !item.jemaatId) {
        addIssue(["items", index, "jemaatId"], "Pilih jemaat");
      }

      if (item.hasPeriod && !item.period) {
        addIssue(["items", index, "period"], "Pilih bulan periode");
      }

      if (Number(item.amount || 0) <= 0) {
        addIssue(["items", index, "amount"], "Isi nominal lebih dari 0");
      }

      if (collapseSpaces(item.donorName).length > 100) {
        addIssue(
          ["items", index, "donorName"],
          "Nama pemberi maksimal 100 karakter",
        );
      }
    });
  });

export type PersembahanFormValues = z.infer<typeof persembahanFormSchema>;

export type PersembahanItemValues = PersembahanFormValues["items"][number];

export const EMPTY_ITEM: PersembahanItemValues = {
  typePersembahanId: "",
  typeName: "",
  hasPeriod: false,
  requiresJemaat: false,
  jemaatId: "",
  jemaatName: "",
  period: "",
  amount: "",
  donorName: "",
};

export const emptyPersembahanForm = (
  today: string = todayJakarta(),
): PersembahanFormValues => ({
  receivedDate: today,
  receiveMethod: "TUNAI",
  ibadahId: "",
  receivedBy: "",
  countCheck: "",
  items: [{ ...EMPTY_ITEM }],
});

export const toItemFromType = (
  type: OfferingTypeOption,
  item: PersembahanItemValues,
): PersembahanItemValues => ({
  ...item,
  typePersembahanId: String(type.id),
  typeName: type.name,
  hasPeriod: type.hasPeriod,
  requiresJemaat: type.requiresJemaat,
  jemaatId: type.requiresJemaat ? item.jemaatId : "",
  jemaatName: type.requiresJemaat ? item.jemaatName : "",
  period: type.hasPeriod ? item.period : "",
  donorName: type.requiresJemaat ? "" : item.donorName,
});

export const itemsTotal = (items: readonly PersembahanItemValues[]) =>
  sumAmounts(items.map((item) => item.amount || "0"));

export const itemsSummary = (items: readonly PersembahanItemValues[]) =>
  `${items.length} baris · Total ${formatAmount(itemsTotal(items))}`;

/** Selisih hitung fisik: memperingatkan, tidak pernah memblokir (K8). */
export const countGap = (
  countCheck: string,
  items: readonly PersembahanItemValues[],
) => {
  if (!countCheck) return null;

  const gap = Number(countCheck) - Number(itemsTotal(items));

  return gap === 0 ? null : gap;
};

export const countGapText = (gap: number) =>
  `Hitungan fisik berbeda ${formatRupiah(Math.abs(gap))} dari total baris. Catat sesuai hitungan, lalu bukukan selisihnya di Kas Masuk atau Kas Keluar ke akun Selisih Kas, dengan nomor berita acara di Referensi.`;

export const toBatchPayload = (
  values: PersembahanFormValues,
): PersembahanBatchPayload => ({
  receivedDate: values.receivedDate,
  receiveMethod: values.receiveMethod,
  ibadahId: values.ibadahId ? Number(values.ibadahId) : null,
  receivedBy: values.receivedBy ? Number(values.receivedBy) : null,
  items: values.items.map((item) => ({
    typePersembahanId: Number(item.typePersembahanId),
    jemaatId: item.jemaatId ? Number(item.jemaatId) : null,
    period: item.period ? `${item.period}-01` : null,
    donorName: collapseSpaces(item.donorName) || null,
    amount: Number(item.amount),
  })),
});

export const voidText = (isPosted: boolean) =>
  isPosted
    ? "Persembahan ini akan dibatalkan. Entri jurnalnya akan dibalik dengan tanggal hari ini."
    : "Persembahan ini akan dibatalkan.";
