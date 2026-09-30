/**
 * Tiruan `/api/v1/persembahan` (be-sada `modules/persembahan`) + `/ddl/ibadah`.
 * Append-only: tanpa PUT, tanpa DELETE, hanya `POST /:code/void`.
 *
 * Larik dan bentuk bacaannya tinggal di keuangan-store, karena posting batch
 * Jurnal dan posting Pembayaran ikut membacanya.
 *
 *   MOCK_EMPTY=1           → daftar kosong (404)
 *   MOCK_PERIOD_CLOSED=1   → bulan tanggal terima tertutup: catat dan batal ditolak
 *   MOCK_GATEWAY_GIFT=1    → baris pembayaran online bertanggal hari ini
 *   MOCK_500=1             → daftar menjawab 500
 */
import { MENU } from "../../../src/config/menu";
import { collapseSpaces } from "../../../src/lib/name";
import { DDL_JEMAAT } from "../../mock-dashboard";
import {
  IBADAH_OPTION,
  JOURNAL_ENTRY,
  PERSEMBAHAN,
  TODAY,
  monthLabel,
  periodOf,
  persembahanList,
  persembahanTotals,
  persembahanView,
  reverseDocumentEntry,
  typePersembahanOf,
  type PersembahanRow,
} from "../keuangan-store";
import { denied, json, list, readBody, type MockHandler } from "../kit";

const PERSEMBAHAN_SOURCE = "PERSEMBAHAN";

const pad = (value: number, size = 4) => String(value).padStart(size, "0");

const ibadahOf = (id: number | null) =>
  id === null ? null : (IBADAH_OPTION.find((row) => row.id === id) ?? null);

const jemaatOf = (id: number | null) =>
  id === null ? null : (DDL_JEMAAT.find((row) => row.id === id) ?? null);

/**
 * Entri pembalik tidak tergantung di baris persembahan — ia ditemukan lewat
 * entri asalnya, karena pembalikan selalu `sourceType: MANUAL`.
 */
const reversalRefOf = (item: PersembahanRow) => {
  if (item.journalEntryId === null) return null;

  const reversal = JOURNAL_ENTRY.find(
    (entry) => entry.reversalOfId === item.journalEntryId,
  );

  return reversal ? { code: reversal.code, status: reversal.status } : null;
};

const view = (item: PersembahanRow) => ({
  ...persembahanView(item),
  reversalJournal: reversalRefOf(item),
});

const nextRow = (
  seed: Partial<PersembahanRow> &
    Pick<PersembahanRow, "typePersembahanId" | "amount">,
): PersembahanRow => {
  const id =
    PERSEMBAHAN.reduce((highest, row) => Math.max(highest, row.id), 0) + 1;

  return {
    id,
    publicId: `psb-${pad(id)}`,
    code: `PSB-${TODAY.slice(0, 4)}-${pad(id)}`,
    jemaatId: null,
    donorName: null,
    period: null,
    receiveMethod: "TUNAI",
    receivedDate: TODAY,
    receivedById: null,
    ibadahId: null,
    status: "ACTIVE",
    voidReason: null,
    voidedAt: null,
    voidedById: null,
    journalEntryId: null,
    ...seed,
  };
};

// ---------------------------------------------------------------------------
// Tulis. Seluruh batch diperiksa sebelum apa pun ditulis: satu baris ditolak
// berarti tidak ada yang ditulis.

type Issue = { path: string; message: string };

type BatchBody = {
  receivedDate?: unknown;
  receiveMethod?: unknown;
  ibadahId?: unknown;
  receivedBy?: unknown;
  items?: unknown;
};

type ItemBody = {
  typePersembahanId?: unknown;
  jemaatId?: unknown;
  period?: unknown;
  donorName?: unknown;
  amount?: unknown;
};

const failure = (status: number, issues: Issue[], code?: string) =>
  json(
    {
      status,
      error: issues[0]?.message ?? "Permintaan Tidak Valid",
      code,
      issues,
    },
    status,
  );

const refusal = (status: number, message: string, code?: string) =>
  json({ status, error: message, code }, status);

const numberOf = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const textOf = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const nameOf = (value: unknown) => {
  const text = textOf(value);

  return text ? collapseSpaces(text) : null;
};

const periodRefusal = (date: string) => {
  const period = periodOf(date);
  const label = monthLabel(Number(date.slice(0, 4)), Number(date.slice(5, 7)));

  if (!period) {
    return refusal(
      400,
      `Periode Fiskal ${label} Belum Dibuka`,
      "PERIOD_NOT_OPEN",
    );
  }

  if (period.status === "CLOSED" || process.env.MOCK_PERIOD_CLOSED) {
    return refusal(
      400,
      `Periode Fiskal ${label} Sudah Ditutup`,
      "PERIOD_CLOSED",
    );
  }

  return null;
};

const itemIssues = (items: ItemBody[]): Issue[] => {
  const issues: Issue[] = [];
  const seen = new Map<string, number>();

  items.forEach((item, index) => {
    const at = (field: string, message: string) =>
      issues.push({ path: `items.${index}.${field}`, message });
    const type = typePersembahanOf(numberOf(item.typePersembahanId));
    const jemaatId = numberOf(item.jemaatId);
    const period = textOf(item.period);
    const amount = numberOf(item.amount);

    if (!type) {
      at("typePersembahanId", "Tipe Persembahan Tidak Ditemukan");
    } else if (!type.isActive) {
      at("typePersembahanId", `Tipe Persembahan ${type.name} Tidak Aktif`);
    } else {
      if (type.requiresJemaat && jemaatId === null) {
        at("jemaatId", `Tipe Persembahan ${type.name} Wajib Menunjuk Jemaat`);
      }
      if (type.hasPeriod && !period) {
        at("period", `Tipe Persembahan ${type.name} Wajib Mengisi Periode`);
      }
      if (!type.hasPeriod && period) {
        at("period", `Tipe Persembahan ${type.name} Tidak Memakai Periode`);
      }
    }

    if (amount === null || amount <= 0) {
      at("amount", "Nominal Harus Lebih Dari 0");
    } else if (amount > 9_999_999_999_999) {
      at("amount", "Nominal Terlalu Besar");
    }

    if (jemaatId !== null && !jemaatOf(jemaatId)) {
      at("jemaatId", "Jemaat Tidak Ditemukan");
    }

    // Duplikat: indeks parsial tidak mencakup baris anonim atau tanpa periode,
    // jadi di sana hanya cek ini yang menjaga.
    if (jemaatId !== null && period) {
      const key = `${String(item.typePersembahanId)}|${jemaatId}|${period}|${String(amount)}`;
      const first = seen.get(key);

      if (first === undefined) seen.set(key, index);
      else at("amount", `Baris Ini Sama Dengan Baris ${first + 1}`);
    }
  });

  return issues;
};

const createBatch = async (request: Request) => {
  const body = await readBody<BatchBody>(request);
  const receivedDate = textOf(body.receivedDate);
  const receiveMethod = body.receiveMethod;
  const items = Array.isArray(body.items) ? (body.items as ItemBody[]) : [];

  if (!receivedDate || receivedDate > TODAY) {
    return failure(400, [
      { path: "receivedDate", message: "Tanggal Terima Tidak Valid" },
    ]);
  }

  if (receiveMethod !== "TUNAI" && receiveMethod !== "TRANSFER") {
    return failure(400, [
      {
        path: "receiveMethod",
        message: "Cara Terima Harus Tunai Atau Transfer",
      },
    ]);
  }

  if (items.length === 0 || items.length > 100) {
    return failure(400, [
      { path: "items", message: "Jumlah Baris Harus Antara 1 Dan 100" },
    ]);
  }

  const period = periodRefusal(receivedDate);

  if (period) return period;

  const ibadahId = numberOf(body.ibadahId);

  if (ibadahId !== null && !ibadahOf(ibadahId)) {
    return failure(404, [
      { path: "ibadahId", message: "Ibadah Tidak Ditemukan" },
    ]);
  }

  const issues = itemIssues(items);

  if (issues.length > 0) return failure(400, issues);

  const saved = items.map((item) => {
    const row = nextRow({
      typePersembahanId: Number(item.typePersembahanId),
      jemaatId: numberOf(item.jemaatId),
      period: textOf(item.period)?.slice(0, 10) ?? null,
      donorName: nameOf(item.donorName),
      amount: String(item.amount),
      receiveMethod,
      receivedDate,
      receivedById: numberOf(body.receivedBy),
      ibadahId,
    });

    PERSEMBAHAN.push(row);

    return row;
  });

  return json(
    {
      status: 201,
      message: `Berhasil Mencatat ${saved.length} Persembahan`,
      data: saved.map(view),
    },
    201,
  );
};

const voidOne = async (request: Request, item: PersembahanRow) => {
  const body = await readBody<{ voidReason?: unknown }>(request);
  const reason = textOf(body.voidReason);

  if (!reason || reason.length > 250) {
    return failure(400, [
      { path: "voidReason", message: "Alasan Pembatalan Wajib Diisi" },
    ]);
  }

  if (item.status === "VOID") {
    return refusal(400, "Persembahan Ini Sudah Dibatalkan");
  }

  // Yang sudah diposting dibalik lebih dulu; bulan ini harus terbuka karena
  // entri pembaliknya bertanggal hari ini. Ditolak berarti baris tetap ACTIVE.
  if (item.journalEntryId !== null) {
    if (process.env.MOCK_PERIOD_CLOSED) {
      const closed = periodRefusal(TODAY);

      if (closed) return closed;
    }

    const reversed = reverseDocumentEntry(PERSEMBAHAN_SOURCE, item.id, reason);

    if (reversed && "failure" in reversed) {
      return refusal(400, reversed.failure.message, reversed.failure.code);
    }
  }

  item.status = "VOID";
  item.voidReason = reason;
  item.voidedAt = new Date().toISOString();
  item.voidedById = 4;

  return json({
    status: 200,
    message: "Berhasil Membatalkan Persembahan",
    data: view(item),
  });
};

const findByCode = (raw: string) => {
  const code = decodeURIComponent(raw).toLowerCase();

  return (
    PERSEMBAHAN.find(
      (item) => item.code.toLowerCase() === code || item.publicId === code,
    ) ?? null
  );
};

export const persembahanMock: MockHandler = async (ctx) => {
  const { path, method, url, can } = ctx;

  if (path === "/ddl/ibadah") {
    if (method !== "GET") return null;
    if (!can(MENU.PERSEMBAHAN, "VIEW") && !can(MENU.IBADAH, "VIEW")) {
      return denied();
    }

    const date = url.searchParams.get("date");
    const rows = IBADAH_OPTION.filter((item) => !date || item.date === date);

    if (rows.length === 0) {
      return json({ status: 404, error: "Ibadah Tidak Ditemukan" }, 404);
    }

    return json({
      status: 200,
      message: "Berhasil Mendapatkan Data",
      data: rows,
    });
  }

  if (path !== "/persembahan" && !path.startsWith("/persembahan/")) return null;
  if (path === "/persembahan/saya") return null;

  if (path === "/persembahan" && method === "GET") {
    if (!can(MENU.PERSEMBAHAN, "VIEW")) return denied();
    if (process.env.MOCK_500) {
      return json({ status: 500, error: "Terjadi Kesalahan Pada Server" }, 500);
    }

    const rows = persembahanList(url.searchParams);
    const response = list(rows.map(view), url, "Persembahan", "Persembahan");

    if (response.status !== 200) return response;

    const body = (await response.json()) as Record<string, unknown>;

    return json({ ...body, totalAmount: persembahanTotals(rows) });
  }

  if (path === "/persembahan/batch" && method === "POST") {
    if (!can(MENU.PERSEMBAHAN, "CREATE")) return denied();

    return createBatch(ctx.request);
  }

  const voidMatch = /^\/persembahan\/(.+)\/void$/.exec(path);

  if (voidMatch && method === "POST") {
    if (!can(MENU.PERSEMBAHAN, "DELETE")) return denied();

    const item = findByCode(voidMatch[1] ?? "");

    if (!item) return refusal(404, "Persembahan Tidak Ditemukan");

    return voidOne(ctx.request, item);
  }

  if (method === "GET") {
    if (!can(MENU.PERSEMBAHAN, "VIEW")) return denied();

    const item = findByCode(path.slice("/persembahan/".length));

    if (!item) return refusal(404, "Persembahan Tidak Ditemukan");

    return json({
      status: 200,
      message: "Berhasil Mendapatkan Persembahan",
      data: view(item),
    });
  }

  return null;
};
