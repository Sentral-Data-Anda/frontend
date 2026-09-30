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
import {
  JOURNAL_ENTRY,
  TODAY,
  TYPE_PERSEMBAHAN,
  accountOf,
  codeOf,
  isLive,
  journalList,
  journalView,
  monthLabel,
  periodOf,
  settingAccountOf,
  type JournalEntryRow,
  type JournalLineRow,
} from "../keuangan-store";
import {
  denied,
  json,
  list,
  readBody,
  type MockAction,
  type MockHandler,
} from "../kit";

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

// `journalView` store belum membawa seluruh bentuk kontrak §7: sourceType,
// source.id, isReversal, dan ref pembalikan ber-publicId ditambahkan di sini.
const accountShapeOf = (accountId: number) => {
  const account = accountOf(accountId);

  return account
    ? {
        id: account.id,
        code: account.code,
        name: account.name,
        type: account.type,
      }
    : null;
};

const refOf = (entryId: number | null) => {
  const entry =
    entryId === null
      ? null
      : (JOURNAL_ENTRY.find((other) => other.id === entryId) ?? null);

  return entry
    ? { publicId: entry.publicId, code: entry.code, entryDate: entry.entryDate }
    : null;
};

const view = (row: JournalEntryRow, isDetail = false) => {
  const reversedBy =
    JOURNAL_ENTRY.find((other) => other.reversalOfId === row.id) ?? null;

  return {
    ...journalView(row, isDetail),
    sourceType: row.sourceType,
    source: { type: row.sourceType, id: row.sourceId },
    reversalOfId: row.reversalOfId,
    isReversal: row.reversalOfId !== null,
    ...(isDetail
      ? {
          lines: row.lines.map((line) => ({
            id: `jln-${line.id}`,
            publicId: `jln-${line.id}`,
            accountId: line.accountId,
            account: accountShapeOf(line.accountId),
            debit: line.debit,
            credit: line.credit,
            description: line.description,
          })),
          reversalOf: refOf(row.reversalOfId),
          reversedBy: reversedBy ? refOf(reversedBy.id) : null,
        }
      : {}),
  };
};

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

const periodFailure = (date: string) => {
  const period = periodOf(date);
  const label = monthLabel(Number(date.slice(0, 4)), Number(date.slice(5, 7)));

  if (!period) {
    return fail(400, `Periode Fiskal ${label} Belum Dibuka`, "PERIOD_NOT_OPEN");
  }
  if (period.status === "CLOSED" || process.env.MOCK_PERIOD_CLOSED) {
    return fail(400, `Periode Fiskal ${label} Sudah Ditutup`, "PERIOD_CLOSED");
  }

  return null;
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

const find = (key: string) =>
  JOURNAL_ENTRY.find(
    (row) =>
      row.publicId.toLowerCase() === key.toLowerCase() ||
      row.code.toLowerCase() === key.toLowerCase(),
  );

const detail = (
  row: JournalEntryRow,
  status = 200,
  message = "Berhasil Mendapatkan Jurnal",
) => json({ status, message, data: view(row, true) }, status);

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
  code: string;
  typeId: number;
  receiveMethod: "TUNAI" | "TRANSFER" | "PAYMENT_GATEWAY";
  amount: string;
  receivedDate: string;
};

const SETTING_KEY = {
  TUNAI: "PERSEMBAHAN_KAS",
  TRANSFER: "PERSEMBAHAN_BANK",
  PAYMENT_GATEWAY: "PERSEMBAHAN_GATEWAY",
} as const;

const giftsIn = (from: string, to: string): Gift[] => {
  const day = (offset: number) => {
    const date = new Date(`${from}T00:00:00Z`);

    date.setUTCDate(date.getUTCDate() + offset);

    const iso = date.toISOString().slice(0, 10);

    return iso > to ? to : iso;
  };

  const gifts = TYPE_PERSEMBAHAN.filter((type) => isLive(type)).map(
    (type, index): Gift => ({
      code: `PSB-${from.slice(0, 7).replace("-", "")}-${String(index + 1).padStart(3, "0")}`,
      typeId: type.id,
      receiveMethod: index % 3 === 1 ? "TRANSFER" : "TUNAI",
      amount: String(500000 * (index + 1)),
      receivedDate: day(index * 3),
    }),
  );

  if (process.env.MOCK_GATEWAY_GIFT) {
    gifts.push({
      code: `PSB-${from.slice(0, 7).replace("-", "")}-900`,
      typeId: TYPE_PERSEMBAHAN[0].id,
      receiveMethod: "PAYMENT_GATEWAY",
      amount: "750000",
      receivedDate: day(1),
    });
  }

  return gifts;
};

const refusalOf = (gift: Gift) => {
  const type = TYPE_PERSEMBAHAN.find((row) => row.id === gift.typeId);

  if (!type || type.accountId === null) {
    return {
      reason: `Tipe Persembahan ${type?.name ?? "Ini"} Belum Memiliki Akun. Lengkapi Terlebih Dahulu`,
      reasonCode: "OFFERING_TYPE_NO_ACCOUNT",
    };
  }

  const key = SETTING_KEY[gift.receiveMethod];
  const settingAccountId = process.env.MOCK_SETTING_EMPTY
    ? null
    : settingAccountOf(key);

  if (settingAccountId === null) {
    return {
      reason: `Setelan Akuntansi ${key} Belum Diisi. Tetapkan Akunnya Terlebih Dahulu`,
      reasonCode: "SETTING_EMPTY",
    };
  }

  for (const accountId of [settingAccountId, type.accountId]) {
    const account = accountOf(accountId);

    if (!account || !isLive(account) || !account.isActive) {
      return {
        reason: `Akun ${account?.code ?? accountId} Sudah Tidak Aktif`,
        reasonCode: "ACCOUNT_INACTIVE",
      };
    }
  }

  const label = monthLabel(
    Number(gift.receivedDate.slice(0, 4)),
    Number(gift.receivedDate.slice(5, 7)),
  );
  const period = periodOf(gift.receivedDate);

  if (!period) {
    return {
      reason: `Periode Fiskal ${label} Belum Dibuka`,
      reasonCode: "PERIOD_NOT_OPEN",
    };
  }
  if (period.status === "CLOSED" || process.env.MOCK_PERIOD_CLOSED) {
    return {
      reason: `Periode Fiskal ${label} Sudah Ditutup`,
      reasonCode: "PERIOD_CLOSED",
    };
  }

  return null;
};

const sourceIdOf = (gift: Gift) =>
  [...gift.code].reduce((hash, char) => hash * 31 + char.charCodeAt(0), 7) %
  1_000_000_007;

const isPosted = (gift: Gift) =>
  JOURNAL_ENTRY.some(
    (row) =>
      row.sourceType === "PERSEMBAHAN" && row.sourceId === sourceIdOf(gift),
  );

const writeGift = (gift: Gift) => {
  const type = TYPE_PERSEMBAHAN.find((row) => row.id === gift.typeId);
  const debitId = settingAccountOf(SETTING_KEY[gift.receiveMethod]);

  if (!type || type.accountId === null || debitId === null) return;

  JOURNAL_ENTRY.push({
    id: nextEntryId(),
    publicId: `jrn-${crypto.randomUUID()}`,
    code: codeOf("JRN", { yearly: true }),
    entryDate: gift.receivedDate,
    description: `Persembahan ${type.name} ${gift.code}`,
    status: "POSTED",
    sourceType: "PERSEMBAHAN",
    sourceId: sourceIdOf(gift),
    reversalOfId: null,
    postedById: SESSION_USER_ID,
    postedAt: new Date().toISOString(),
    lines: [
      {
        id: lineId(),
        accountId: debitId,
        debit: gift.amount,
        credit: "0",
        description: null,
      },
      {
        id: lineId(),
        accountId: type.accountId,
        debit: "0",
        credit: gift.amount,
        description: null,
      },
    ],
  });
};

const daysBetween = (from: string, to: string) =>
  Math.round(
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) /
      86400000,
  ) + 1;

const onPostPersembahan = (
  url: URL,
  body: { from?: unknown; to?: unknown },
) => {
  const dryRun = url.searchParams.get("dryRun");

  // Tombol paling berbahaya di aplikasi ini tidak boleh berubah menjadi
  // posting sungguhan karena salah ketik.
  if (dryRun !== null && !/^(1|0|true|false)$/i.test(dryRun)) {
    return fieldError("dryRun", "Nilai dryRun Tidak Valid");
  }

  const isDryRun = dryRun !== null && /^(1|true)$/i.test(dryRun);
  const from = typeof body.from === "string" ? body.from : "";
  const to = typeof body.to === "string" ? body.to : "";

  if (!/^\d{4}-\d{2}-\d{2}$/.test(from)) {
    return fieldError("from", "Mohon Lengkapi Tanggal Awal");
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(to)) {
    return fieldError("to", "Mohon Lengkapi Tanggal Akhir");
  }
  if (to < from) {
    return fieldError(
      "to",
      "Tanggal Akhir Harus Sama Atau Sesudah Tanggal Awal",
    );
  }
  if (daysBetween(from, to) > MAX_RANGE_DAYS) {
    return fieldError("to", `Rentang Maksimal ${MAX_RANGE_DAYS} Hari`);
  }

  const gifts = giftsIn(from, to);
  const refused: { code: string; reason: string; reasonCode: string }[] = [];
  const postable: Gift[] = [];
  let skipped = 0;

  for (const gift of gifts) {
    if (isPosted(gift)) {
      skipped += 1;
      continue;
    }

    const refusal = refusalOf(gift);

    if (refusal) refused.push({ code: gift.code, ...refusal });
    else postable.push(gift);
  }

  if (!isDryRun) for (const gift of postable) writeGift(gift);

  return json(
    {
      status: isDryRun ? 200 : 201,
      message: isDryRun
        ? "Berhasil Memeriksa Posting Persembahan"
        : "Berhasil Memposting Persembahan Ke Jurnal",
      data: { posted: postable.length, skipped, refused },
    },
    isDryRun ? 200 : 201,
  );
};

const onList = (url: URL) => {
  if (process.env.MOCK_500) return serverError();

  return list(
    journalList(url.searchParams).map((row) => view(row)),
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

  if (key === "posting-persembahan") {
    if (method !== "POST" || step) return null;
    if (process.env.MOCK_JURNAL_ACTION_500) return serverError();

    return onPostPersembahan(url, await readBody(request));
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
