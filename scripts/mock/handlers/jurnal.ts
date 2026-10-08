/**
 * Tiruan `/api/v1/jurnal` (be-sada `modules/jurnal`) di atas larik JOURNAL_ENTRY
 * store Keuangan, termasuk `POST /posting-persembahan`.
 *
 *   MOCK_EMPTY=1            → daftar kosong (404)
 *   MOCK_500=1              → daftar menjawab 500
 *   MOCK_UNBALANCED=1       → posting ditolak: tidak seimbang
 *   MOCK_PERIOD_CLOSED=1    → tulis dan posting ditolak: periode tertutup
 *   MOCK_SETTING_EMPTY=1    → batch menolak baris tunai: setelan belum diisi
 *   MOCK_GATEWAY_GIFT=1     → batch menolak satu baris gateway, sisanya jalan
 *   MOCK_JURNAL_ACTION_500=1 → aksi tulis menjawab 500
 */
import { MENU } from "../../../src/config/menu";
import { SESSION_USER_ID } from "../../mock-dashboard";
import { ASSET, TYPE_ITEM, supplierOf } from "../inventaris-store";
import {
  JOURNAL_ENTRY,
  TODAY,
  TYPE_PERSEMBAHAN,
  accountOf,
  codeOf,
  isLive,
  journalList,
  journalOfSource,
  journalView,
  monthLabel,
  periodOf,
  postDocumentEntry,
  settingAccountOf,
  type JournalEntryRow,
  type JournalLineRow,
  type PostFailure,
} from "../keuangan-store";
import {
  denied,
  json,
  list,
  readBody,
  type MockAction,
  type MockHandler,
} from "../kit";
import {
  SUPPLIER_INVOICE,
  SUPPLIER_PAYMENT,
  isLive as isLivePengadaan,
} from "../pengadaan-store";

const NOT_FOUND = "Jurnal Tidak Ditemukan";

const maxIdOf = (ids: readonly number[]) => Math.max(0, ...ids) + 1;

let entryCounter = maxIdOf(JOURNAL_ENTRY.map((row) => row.id));

let lineCounter = maxIdOf(
  JOURNAL_ENTRY.flatMap((row) => row.lines).map((line) => line.id),
);

const nextEntryId = () => entryCounter++;

const lineId = () => lineCounter++;

const MAX_LINES = 50;

const MAX_RANGE_DAYS = 31;

const PERSEMBAHAN_SOURCE = "PERSEMBAHAN";

const ACTION: Record<string, MockAction> = {
  POST: "CREATE",
  PUT: "UPDATE",
  DELETE: "DELETE",
};

const serverError = () =>
  json({ status: 500, error: "Internal Server Error" }, 500);

const fail = (status: number, message: string, code?: string) =>
  json({ status, error: message, ...(code ? { code } : {}) }, status);

const fieldError = (path: string, message: string) =>
  json({ status: 400, error: message, issues: [{ path, message }] }, 400);

// Sisi jurnal dibandingkan sebagai desimal, tidak pernah sebagai float.
const toCents = (value: string) => {
  const [whole, fraction = ""] = String(value ?? "0").split(".");
  const cents = `${fraction}00`.slice(0, 2);

  return Number(whole || "0") * 100 + Number(cents);
};

const totalCentsOf = (lines: JournalLineRow[], side: "debit" | "credit") =>
  lines.reduce((total, row) => total + toCents(row[side]), 0);

type BodyLine = {
  accountId?: unknown;
  debit?: unknown;
  credit?: unknown;
  description?: unknown;
};

type Body = {
  entryDate?: unknown;
  description?: unknown;
  lines?: unknown;
};

const amountOf = (value: unknown) => {
  if (value === undefined || value === null || value === "") return "0";

  const text = String(value);

  return /^\d+(\.\d{1,2})?$/.test(text) ? text : null;
};

function parseBody(body: Body) {
  const entryDate = typeof body.entryDate === "string" ? body.entryDate : "";

  if (!/^\d{4}-\d{2}-\d{2}$/.test(entryDate)) {
    return { failure: fieldError("entryDate", "Mohon Lengkapi Tanggal Entri") };
  }
  if (entryDate > TODAY) {
    return {
      failure: fieldError(
        "entryDate",
        "Tanggal Entri Tidak Boleh Di Masa Depan",
      ),
    };
  }

  const description =
    typeof body.description === "string" ? body.description.trim() : "";

  if (!description) {
    return { failure: fieldError("description", "Mohon Lengkapi Keterangan") };
  }
  if (description.length > 250) {
    return {
      failure: fieldError(
        "description",
        "Keterangan tidak boleh lebih dari 250 karakter",
      ),
    };
  }

  const rows = Array.isArray(body.lines) ? (body.lines as BodyLine[]) : [];

  if (rows.length < 2) {
    return {
      failure: fieldError("lines", "Jurnal Harus Memiliki Minimal 2 Baris"),
    };
  }
  if (rows.length > MAX_LINES) {
    return {
      failure: fieldError("lines", `Maksimal ${MAX_LINES} baris per entri`),
    };
  }

  const lines: JournalLineRow[] = [];

  for (const [index, row] of rows.entries()) {
    const at = (field: string) => `lines.${index}.${field}`;
    const accountId =
      typeof row.accountId === "number" ? row.accountId : Number(row.accountId);

    if (!Number.isInteger(accountId) || accountId <= 0) {
      return { failure: fieldError(at("accountId"), "Mohon Lengkapi Akun") };
    }

    const debit = amountOf(row.debit);
    const credit = amountOf(row.credit);

    if (debit === null) {
      return { failure: fieldError(at("debit"), "Format Debit Tidak Valid") };
    }
    if (credit === null) {
      return { failure: fieldError(at("credit"), "Format Kredit Tidak Valid") };
    }
    if (toCents(debit) > 0 && toCents(credit) > 0) {
      return {
        failure: fieldError(
          at("debit"),
          "Setiap Baris Jurnal Harus Diisi Debit Saja Atau Kredit Saja",
        ),
      };
    }

    lines.push({
      id: lineId(),
      accountId,
      debit,
      credit,
      description:
        typeof row.description === "string" && row.description.trim()
          ? row.description.trim()
          : null,
    });
  }

  return { entryDate, description, lines };
}

// Cermin `postDocumentEntry`: dua cabang yang sama, satu tempat, supaya
// pratinjau batch tidak pernah menjanjikan lebih dari yang ditulis.
const periodFailureOf = (date: string): PostFailure | null => {
  const period = periodOf(date);
  const label = monthLabel(Number(date.slice(0, 4)), Number(date.slice(5, 7)));

  if (!period) {
    return {
      code: "PERIOD_NOT_OPEN",
      message: `Periode Fiskal ${label} Belum Dibuka`,
    };
  }
  if (period.status === "CLOSED" || process.env.MOCK_PERIOD_CLOSED) {
    return {
      code: "PERIOD_CLOSED",
      message: `Periode Fiskal ${label} Sudah Ditutup`,
    };
  }

  return null;
};

const periodFailure = (date: string) => {
  const failure = periodFailureOf(date);

  return failure ? fail(400, failure.message, failure.code) : null;
};

const accountFailure = (lines: JournalLineRow[]) => {
  for (const row of lines) {
    const account = accountOf(row.accountId);

    if (!account || !isLive(account)) return fail(404, "Akun Tidak Ditemukan");
    if (!account.isActive) {
      return fail(
        400,
        `Akun ${account.code} Sudah Tidak Aktif`,
        "ACCOUNT_INACTIVE",
      );
    }
  }

  return null;
};

// be-sada mencari entri hanya lewat publicId. Menerima kode juga membuat mock
// lebih longgar daripada server, dan tautan yang salah kunci lolos di sini lalu
// 404 di produksi.
const find = (key: string) =>
  JOURNAL_ENTRY.find((row) => row.publicId.toLowerCase() === key.toLowerCase());

const detail = (
  row: JournalEntryRow,
  status = 200,
  message = "Berhasil Mendapatkan Jurnal",
) => json({ status, message, data: journalView(row, true) }, status);

const onCreate = (parsed: ReturnType<typeof parseBody>) => {
  if (parsed.failure) return parsed.failure;

  const { entryDate, description, lines } = parsed as {
    entryDate: string;
    description: string;
    lines: JournalLineRow[];
  };
  const blocked = periodFailure(entryDate) ?? accountFailure(lines);

  if (blocked) return blocked;

  const row: JournalEntryRow = {
    id: nextEntryId(),
    publicId: `jrn-${crypto.randomUUID()}`,
    code: codeOf("JRN", { yearly: true }),
    entryDate,
    description,
    status: "DRAFT",
    sourceType: "MANUAL",
    sourceId: null,
    reversalOfId: null,
    postedById: null,
    postedAt: null,
    lines,
  };

  JOURNAL_ENTRY.push(row);

  return detail(row, 201, "Berhasil Menambahkan Jurnal");
};

const onUpdate = (
  row: JournalEntryRow,
  parsed: ReturnType<typeof parseBody>,
) => {
  if (row.status !== "DRAFT") {
    return fail(400, "Jurnal Ini Sudah Diposting. Gunakan Pembalikan");
  }
  if (parsed.failure) return parsed.failure;

  const { entryDate, description, lines } = parsed as {
    entryDate: string;
    description: string;
    lines: JournalLineRow[];
  };
  const blocked = periodFailure(entryDate) ?? accountFailure(lines);

  if (blocked) return blocked;

  row.entryDate = entryDate;
  row.description = description;
  row.lines = lines;

  return detail(row, 200, "Berhasil Mengubah Jurnal");
};

const onDelete = (row: JournalEntryRow) => {
  if (row.status !== "DRAFT") {
    return fail(400, "Jurnal Ini Sudah Diposting. Gunakan Pembalikan");
  }

  JOURNAL_ENTRY.splice(JOURNAL_ENTRY.indexOf(row), 1);

  return json({
    status: 200,
    message: "Berhasil Menghapus Jurnal",
    data: { id: row.publicId, code: row.code },
  });
};

const onPost = (row: JournalEntryRow) => {
  if (row.status !== "DRAFT") return fail(400, "Jurnal Ini Sudah Diposting");
  if (row.lines.length < 2) {
    return fail(400, "Jurnal Harus Memiliki Minimal 2 Baris");
  }

  const debit = totalCentsOf(row.lines, "debit");
  const credit = totalCentsOf(row.lines, "credit");

  if (debit !== credit || debit === 0 || process.env.MOCK_UNBALANCED) {
    return fail(400, "Total Debit Dan Kredit Harus Seimbang Dan Lebih Dari 0");
  }

  const blocked = periodFailure(row.entryDate) ?? accountFailure(row.lines);

  if (blocked) return blocked;

  row.status = "POSTED";
  row.postedById = SESSION_USER_ID;
  row.postedAt = new Date().toISOString();

  return detail(row, 200, "Berhasil Memposting Jurnal");
};

const onReverse = (row: JournalEntryRow, body: Body) => {
  if (row.status !== "POSTED") {
    return fail(400, "Hanya Jurnal Yang Sudah Diposting Yang Dapat Dibalik");
  }
  if (row.reversalOfId !== null) {
    return fail(400, "Entri Pembalik Tidak Dapat Dibalik");
  }
  if (JOURNAL_ENTRY.some((other) => other.reversalOfId === row.id)) {
    return fail(400, "Jurnal Ini Sudah Dibalik");
  }

  const entryDate = typeof body.entryDate === "string" ? body.entryDate : "";

  if (!/^\d{4}-\d{2}-\d{2}$/.test(entryDate)) {
    return fieldError("entryDate", "Mohon Lengkapi Tanggal Pembalikan");
  }
  if (entryDate > TODAY) {
    return fieldError("entryDate", "Tanggal Tidak Boleh Di Masa Depan");
  }

  const description =
    typeof body.description === "string" ? body.description.trim() : "";

  if (!description) {
    return fieldError("description", "Mohon Lengkapi Keterangan");
  }

  const blocked = periodFailure(entryDate) ?? accountFailure(row.lines);

  if (blocked) return blocked;

  const reversal: JournalEntryRow = {
    id: nextEntryId(),
    publicId: `jrn-${crypto.randomUUID()}`,
    code: codeOf("JRN", { yearly: true }),
    entryDate,
    description,
    status: "POSTED",
    sourceType: "MANUAL",
    sourceId: null,
    reversalOfId: row.id,
    postedById: SESSION_USER_ID,
    postedAt: new Date().toISOString(),
    lines: row.lines.map((line) => ({
      id: lineId(),
      accountId: line.accountId,
      debit: line.credit,
      credit: line.debit,
      description: line.description,
    })),
  };

  row.status = "REVERSED";
  JOURNAL_ENTRY.push(reversal);

  return detail(reversal, 201, "Berhasil Membalik Jurnal");
};

// --------------------------------------------------------------------------
// Posting persembahan. Tidak ada larik PERSEMBAHAN di store bersama, jadi
// dokumen sumber dibangkitkan dari TYPE_PERSEMBAHAN: satu per tipe per bulan.
// Pratinjau menjalankan pemeriksaan yang sama dengan posting sungguhan.

type Gift = {
  id: number;
  code: string;
  typeId: number;
  receiveMethod: "TUNAI" | "TRANSFER" | "PAYMENT_GATEWAY";
  amount: string;
  receivedDate: string;
};

const SETTING_KEY = {
  TUNAI: "PERSEMBAHAN_KAS",
  TRANSFER: "PERSEMBAHAN_BANK",
  PAYMENT_GATEWAY: "KAS_GATEWAY",
} as const;

// `PREFIX-TAHUN-NOMOR`, tahun dari jam (be-sada `generateCode`); nomor = id agar unik lintas bulan.
const giftCodeOf = (id: number) =>
  `PSB-${TODAY.slice(0, 4)}-${String(id).padStart(4, "0")}`;

const giftIdOf = (from: string, index: number) =>
  (Number(from.slice(0, 4)) * 12 + Number(from.slice(5, 7))) * 100 + index;

const giftsIn = (from: string, to: string): Gift[] => {
  const day = (offset: number) => {
    const date = new Date(`${from}T00:00:00Z`);

    date.setUTCDate(date.getUTCDate() + offset);

    const iso = date.toISOString().slice(0, 10);

    return iso > to ? to : iso;
  };

  const gifts = TYPE_PERSEMBAHAN.filter((type) => isLive(type)).map(
    (type, index): Gift => ({
      id: giftIdOf(from, index + 1),
      code: giftCodeOf(giftIdOf(from, index + 1)),
      typeId: type.id,
      receiveMethod: index % 3 === 1 ? "TRANSFER" : "TUNAI",
      amount: String(500000 * (index + 1)),
      receivedDate: day(index * 3),
    }),
  );

  if (process.env.MOCK_GATEWAY_GIFT) {
    gifts.push({
      id: giftIdOf(from, 90),
      code: giftCodeOf(giftIdOf(from, 90)),
      typeId: TYPE_PERSEMBAHAN[0].id,
      receiveMethod: "PAYMENT_GATEWAY",
      amount: "750000",
      receivedDate: day(1),
    });
  }

  return gifts;
};

type TypeRow = (typeof TYPE_PERSEMBAHAN)[number];

// Penolakan khas persembahan: yang tidak bisa diketahui `postDocumentEntry`,
// karena ia tidak tahu tipe persembahan maupun setelan akuntansi.
const giftSetupOf = (
  gift: Gift,
): { failure: PostFailure } | { type: TypeRow; debitId: number } => {
  const type = TYPE_PERSEMBAHAN.find((row) => row.id === gift.typeId);

  if (!type || type.accountId === null) {
    return {
      failure: {
        code: "OFFERING_TYPE_NO_ACCOUNT",
        message: `Tipe Persembahan ${type?.name ?? "Ini"} Belum Memiliki Akun. Lengkapi Terlebih Dahulu`,
      },
    };
  }

  const key = SETTING_KEY[gift.receiveMethod];
  const settingAccountId = process.env.MOCK_SETTING_EMPTY
    ? null
    : settingAccountOf(key);

  if (settingAccountId === null) {
    return {
      failure: {
        code: "SETTING_EMPTY",
        message: `Setelan Akuntansi ${key} Belum Diisi. Tetapkan Akunnya Terlebih Dahulu`,
      },
    };
  }

  for (const accountId of [settingAccountId, type.accountId]) {
    const account = accountOf(accountId);

    if (!account || !isLive(account) || !account.isActive) {
      return {
        failure: {
          code: "ACCOUNT_INACTIVE",
          message: `Akun ${account?.code ?? accountId} Sudah Tidak Aktif`,
        },
      };
    }
  }

  return { type, debitId: settingAccountId };
};

const giftLines = (gift: Gift, type: TypeRow, debitId: number) => [
  { accountId: debitId, debit: gift.amount, credit: "0" },
  { accountId: type.accountId as number, debit: "0", credit: gift.amount },
];

const giftEntry = (gift: Gift, type: TypeRow, debitId: number) =>
  postDocumentEntry({
    sourceType: PERSEMBAHAN_SOURCE,
    sourceId: gift.id,
    entryDate: gift.receivedDate,
    description: `Persembahan ${type.name} ${gift.code}`,
    lines: giftLines(gift, type, debitId),
  });

const daysBetween = (from: string, to: string) =>
  Math.round(
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) /
      86400000,
  ) + 1;

const ASET_SOURCE = "ASSET_ACQUISITION";

/**
 * Rentang dan bendera pratinjau, diperiksa sekali untuk kedua posting.
 *
 * Tombol paling berbahaya di aplikasi ini tidak boleh berubah menjadi posting
 * sungguhan karena salah ketik, dan dua salinan pemeriksaan itu adalah dua
 * tempat yang bisa menyimpang.
 */
const rangeOf = (
  url: URL,
  body: { from?: unknown; to?: unknown },
): { failure: Response } | { isDryRun: boolean; from: string; to: string } => {
  const dryRun = url.searchParams.get("dryRun");

  if (dryRun !== null && !/^(1|0|true|false)$/i.test(dryRun)) {
    return { failure: fieldError("dryRun", "Nilai dryRun Tidak Valid") };
  }

  const from = typeof body.from === "string" ? body.from : "";
  const to = typeof body.to === "string" ? body.to : "";

  if (!/^\d{4}-\d{2}-\d{2}$/.test(from)) {
    return { failure: fieldError("from", "Mohon Lengkapi Tanggal Awal") };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(to)) {
    return { failure: fieldError("to", "Mohon Lengkapi Tanggal Akhir") };
  }
  if (to < from) {
    return {
      failure: fieldError(
        "to",
        "Tanggal Akhir Harus Sama Atau Sesudah Tanggal Awal",
      ),
    };
  }
  if (daysBetween(from, to) > MAX_RANGE_DAYS) {
    return {
      failure: fieldError("to", `Rentang Maksimal ${MAX_RANGE_DAYS} Hari`),
    };
  }

  return {
    isDryRun: dryRun !== null && /^(1|true)$/i.test(dryRun),
    from,
    to,
  };
};

/**
 * Aset yang BISA dibukukan: sumbangan dan hibah saja.
 *
 * Yang dibeli masuk buku bersama fakturnya, dan menyertakannya di sini akan
 * menghitung pembelian yang sama dua kali — tiruan yang lebih longgar dari
 * server menyembunyikan cacat itu dari layar maupun dari tinjauan.
 */
const donatedIn = (from: string, to: string) =>
  ASSET.filter(
    (row) =>
      isLive(row) &&
      (row.acquisitionSource === "DONATION" ||
        row.acquisitionSource === "GRANT") &&
      typeof row.acquisitionDate === "string" &&
      row.acquisitionDate >= from &&
      row.acquisitionDate <= to,
  );

const assetDebitOf = (typeId: number) => {
  const type = TYPE_ITEM.find((row) => row.id === typeId);

  return type?.assetAccountId ?? settingAccountOf("ASET_TETAP");
};

const FAKTUR_SOURCE = "SUPPLIER_INVOICE";
const BAYAR_SOURCE = "SUPPLIER_PAYMENT";

/**
 * Faktur supplier dan pembayarannya, dalam urutan itu.
 *
 * Pembayaran MENDEBIT hutang yang DIKREDIT fakturnya, jadi fakturnya dulu.
 * Tiruan yang membalik urutannya akan menolak pembayaran yang server terima,
 * dan layar yang ditinjau di atasnya meninjau perilaku yang tidak ada.
 */
const onPostPengadaan = (url: URL, body: { from?: unknown; to?: unknown }) => {
  const checked = rangeOf(url, body);
  if ("failure" in checked) return checked.failure;

  const { isDryRun, from, to } = checked;

  const refused: { code: string; reason: string; reasonCode: string }[] = [];
  let posted = 0;
  let skipped = 0;

  const payableOf = (supplierId: number) =>
    supplierOf(supplierId)?.payableAccountId ??
    settingAccountOf("HUTANG_SUPPLIER");

  const bookedHere = new Set<number>();

  const invoices = SUPPLIER_INVOICE.filter(
    (row) =>
      isLivePengadaan(row) &&
      row.status !== "DRAFT" &&
      row.status !== "CANCELLED" &&
      row.invoiceDate >= from &&
      row.invoiceDate <= to,
  );

  for (const row of invoices) {
    if (journalOfSource(FAKTUR_SOURCE, row.id)) {
      skipped += 1;
      continue;
    }

    const debitId = row.expenseAccountId ?? settingAccountOf("BEBAN_PENGADAAN");
    const creditId = payableOf(row.supplierId);

    if (!debitId || !creditId) {
      refused.push({
        code: row.code,
        reason: `Setelan Akuntansi ${debitId ? "HUTANG_SUPPLIER" : "BEBAN_PENGADAAN"} Belum Diisi. Tetapkan Akunnya Terlebih Dahulu`,
        reasonCode: "SETTING_EMPTY",
      });
      continue;
    }

    if (isDryRun) {
      const failure = periodFailureOf(row.invoiceDate);
      if (failure) {
        refused.push({
          code: row.code,
          reason: failure.message,
          reasonCode: failure.code,
        });
        continue;
      }

      bookedHere.add(row.id);
      posted += 1;
      continue;
    }

    const result = postDocumentEntry({
      sourceType: FAKTUR_SOURCE,
      sourceId: row.id,
      entryDate: row.invoiceDate,
      description: `Faktur Supplier ${row.code}`,
      lines: [
        { accountId: debitId, debit: row.totalIDR, credit: "0" },
        { accountId: creditId, debit: "0", credit: row.totalIDR },
      ],
    });

    if ("failure" in result) {
      refused.push({
        code: row.code,
        reason: result.failure.message,
        reasonCode: result.failure.code,
      });
      continue;
    }

    bookedHere.add(row.id);
    posted += 1;
  }

  const payments = SUPPLIER_PAYMENT.filter(
    (row) => row.paymentDate >= from && row.paymentDate <= to,
  );

  for (const row of payments) {
    if (journalOfSource(BAYAR_SOURCE, row.id)) {
      skipped += 1;
      continue;
    }

    const invoice = SUPPLIER_INVOICE.find(
      (one) => one.id === row.supplierInvoiceId,
    );
    if (!invoice) continue;

    if (
      !journalOfSource(FAKTUR_SOURCE, invoice.id) &&
      !bookedHere.has(invoice.id)
    ) {
      refused.push({
        code: row.code,
        reason: `Faktur ${invoice.code} Belum Diposting. Posting Fakturnya Terlebih Dahulu`,
        reasonCode: "INVOICE_NOT_POSTED",
      });
      continue;
    }

    const debitId = payableOf(invoice.supplierId);
    if (!debitId) {
      refused.push({
        code: row.code,
        reason:
          "Setelan Akuntansi HUTANG_SUPPLIER Belum Diisi. Tetapkan Akunnya Terlebih Dahulu",
        reasonCode: "SETTING_EMPTY",
      });
      continue;
    }

    if (isDryRun) {
      const failure = periodFailureOf(row.paymentDate);
      if (failure) {
        refused.push({
          code: row.code,
          reason: failure.message,
          reasonCode: failure.code,
        });
        continue;
      }

      posted += 1;
      continue;
    }

    const result = postDocumentEntry({
      sourceType: BAYAR_SOURCE,
      sourceId: row.id,
      entryDate: row.paymentDate,
      description: `Pembayaran Faktur ${row.code}`,
      lines: [
        { accountId: debitId, debit: row.amountIDR, credit: "0" },
        { accountId: row.accountId, debit: "0", credit: row.amountIDR },
      ],
    });

    if ("failure" in result) {
      refused.push({
        code: row.code,
        reason: result.failure.message,
        reasonCode: result.failure.code,
      });
      continue;
    }

    posted += 1;
  }

  return json(
    {
      status: isDryRun ? 200 : 201,
      message: isDryRun
        ? "Berhasil Memeriksa Posting Pengadaan"
        : "Berhasil Memposting Pengadaan Ke Jurnal",
      data: { posted, skipped, refused },
    },
    isDryRun ? 200 : 201,
  );
};

const onPostAset = (url: URL, body: { from?: unknown; to?: unknown }) => {
  const checked = rangeOf(url, body);
  if ("failure" in checked) return checked.failure;

  const { isDryRun, from, to } = checked;

  const refused: { code: string; reason: string; reasonCode: string }[] = [];
  let posted = 0;
  let skipped = 0;

  for (const row of donatedIn(from, to)) {
    if (journalOfSource(ASET_SOURCE, row.id)) {
      skipped += 1;
      continue;
    }

    // Ditolak, bukan dilewati: aset yang tidak pernah dinilai siapa pun adalah
    // lubang yang pantas disebut.
    if (row.acquisitionCost === null) {
      refused.push({
        code: row.code,
        reason: `Aset ${row.name} Belum Memiliki Biaya Perolehan. Isi Nilainya Terlebih Dahulu`,
        reasonCode: "ASSET_NO_COST",
      });
      continue;
    }

    const debitId = assetDebitOf(row.typeId);
    const creditId = settingAccountOf("SUMBANGAN_ASET");

    if (!debitId || !creditId) {
      refused.push({
        code: row.code,
        reason: `Setelan Akuntansi ${debitId ? "SUMBANGAN_ASET" : "ASET_TETAP"} Belum Diisi. Tetapkan Akunnya Terlebih Dahulu`,
        reasonCode: "SETTING_EMPTY",
      });
      continue;
    }

    const amount = String(row.acquisitionCost);
    const entryDate = row.acquisitionDate as string;

    if (isDryRun) {
      const failure = periodFailureOf(entryDate);
      if (failure) {
        refused.push({
          code: row.code,
          reason: failure.message,
          reasonCode: failure.code,
        });
        continue;
      }

      posted += 1;
      continue;
    }

    const result = postDocumentEntry({
      sourceType: ASET_SOURCE,
      sourceId: row.id,
      entryDate,
      description: `Sumbangan Aset ${row.name} ${row.code}`,
      lines: [
        { accountId: debitId, debit: amount, credit: "0" },
        { accountId: creditId, debit: "0", credit: amount },
      ],
    });

    if ("failure" in result) {
      refused.push({
        code: row.code,
        reason: result.failure.message,
        reasonCode: result.failure.code,
      });
      continue;
    }

    posted += 1;
  }

  return json(
    {
      status: isDryRun ? 200 : 201,
      message: isDryRun
        ? "Berhasil Memeriksa Posting Aset"
        : "Berhasil Memposting Aset Ke Jurnal",
      data: { posted, skipped, refused },
    },
    isDryRun ? 200 : 201,
  );
};

const onPostPersembahan = (
  url: URL,
  body: { from?: unknown; to?: unknown },
) => {
  const checked = rangeOf(url, body);
  if ("failure" in checked) return checked.failure;

  const { isDryRun, from, to } = checked;

  const refused: { code: string; reason: string; reasonCode: string }[] = [];
  let posted = 0;
  let skipped = 0;

  const onRefused = (gift: Gift, failure: PostFailure) =>
    refused.push({
      code: gift.code,
      reason: failure.message,
      reasonCode: failure.code,
    });

  for (const gift of giftsIn(from, to)) {
    const setup = giftSetupOf(gift);

    if ("failure" in setup) {
      onRefused(gift, setup.failure);
      continue;
    }

    // Sudah dibukukan itu dilewati, bukan ditolak — bendahara memang sering
    // memilih rentang yang bertumpuk dengan batch sebelumnya.
    if (journalOfSource(PERSEMBAHAN_SOURCE, gift.id)) {
      skipped += 1;
      continue;
    }

    if (isDryRun) {
      const failure = periodFailureOf(gift.receivedDate);

      if (failure) onRefused(gift, failure);
      else posted += 1;

      continue;
    }

    const result = giftEntry(gift, setup.type, setup.debitId);

    if ("failure" in result) {
      if (result.failure.code === "ALREADY_POSTED") skipped += 1;
      else onRefused(gift, result.failure);

      continue;
    }

    posted += 1;
  }

  return json(
    {
      status: isDryRun ? 200 : 201,
      message: isDryRun
        ? "Berhasil Memeriksa Posting Persembahan"
        : "Berhasil Memposting Persembahan Ke Jurnal",
      data: { posted, skipped, refused },
    },
    isDryRun ? 200 : 201,
  );
};

const onList = (url: URL) => {
  if (process.env.MOCK_500) return serverError();

  return list(
    journalList(url.searchParams).map((row) => journalView(row)),
    url,
    "Jurnal",
    "Jurnal",
    "Berhasil Mendapatkan Jurnal",
  );
};

export const jurnalMock: MockHandler = async (ctx) => {
  const { path, method, url, request, can } = ctx;

  if (path !== "/jurnal" && !path.startsWith("/jurnal/")) return null;

  const match = path.match(/^\/jurnal\/([^/]+)(?:\/(post|reverse))?$/);

  if (path !== "/jurnal" && !match) return null;
  if (!can(MENU.JURNAL, ACTION[method] ?? "VIEW")) return denied();

  if (path === "/jurnal") {
    if (method === "GET") return onList(url);
    if (method === "POST") {
      if (process.env.MOCK_JURNAL_ACTION_500) return serverError();

      return onCreate(parseBody(await readBody(request)));
    }

    return null;
  }

  const [, key, step] = match as RegExpMatchArray;

  // Milik handler Pembayaran; tanpa ini /jurnal/* menelannya dan menjawab 404.
  if (key === "posting-pembayaran") return null;

  if (key === "posting-persembahan") {
    if (method !== "POST" || step) return null;
    if (process.env.MOCK_JURNAL_ACTION_500) return serverError();

    return onPostPersembahan(url, await readBody(request));
  }

  if (key === "posting-aset") {
    if (method !== "POST" || step) return null;
    if (process.env.MOCK_JURNAL_ACTION_500) return serverError();

    return onPostAset(url, await readBody(request));
  }

  if (key === "posting-pengadaan") {
    if (method !== "POST" || step) return null;
    if (process.env.MOCK_JURNAL_ACTION_500) return serverError();

    return onPostPengadaan(url, await readBody(request));
  }

  const row = find(decodeURIComponent(key));

  if (!row) return fail(404, NOT_FOUND);
  if (method !== "GET" && process.env.MOCK_JURNAL_ACTION_500) {
    return serverError();
  }

  if (!step && method === "GET") return detail(row);
  if (!step && method === "PUT") {
    return onUpdate(row, parseBody(await readBody(request)));
  }
  if (!step && method === "DELETE") return onDelete(row);
  if (step === "post" && method === "POST") return onPost(row);
  if (step === "reverse" && method === "POST") {
    return onReverse(row, await readBody(request));
  }

  return null;
};
