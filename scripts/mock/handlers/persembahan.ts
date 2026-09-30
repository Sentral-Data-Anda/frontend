/**
 * Tiruan `/api/v1/persembahan` (be-sada `modules/persembahan`) + `/ddl/ibadah`.
 * Append-only: tanpa PUT, tanpa DELETE, hanya `POST /:code/void`.
 *
 * Larik dan pembantunya duduk di sini, bukan di keuangan-store, karena TL-3
 * belum membawanya; TL memindahkannya saat merge supaya posting persembahan
 * milik Jurnal bisa membacanya.
 *
 *   MOCK_EMPTY=1           → daftar kosong (404)
 *   MOCK_PERIOD_CLOSED=1   → bulan tanggal terima tertutup: catat dan batal ditolak
 *   MOCK_GATEWAY_GIFT=1    → baris pembayaran online bertanggal hari ini
 *   MOCK_500=1             → daftar menjawab 500
 */
import { MENU } from "../../../src/config/menu";
import { addDays, startOfMonth } from "../../../src/lib/date";
import { collapseSpaces } from "../../../src/lib/name";
import { DDL_JEMAAT } from "../../mock-dashboard";
import {
  TODAY,
  journalRef,
  monthLabel,
  periodOf,
  typePersembahanOf,
} from "../keuangan-store";
import { denied, json, list, readBody, type MockHandler } from "../kit";

type Row = {
  id: number;
  publicId: string;
  code: string;
  typePersembahanId: number;
  jemaatId: number | null;
  donorName: string | null;
  period: string | null;
  amount: string;
  receiveMethod: "TUNAI" | "TRANSFER" | "PAYMENT_GATEWAY";
  receivedDate: string;
  receivedById: number | null;
  ibadahId: number | null;
  status: "ACTIVE" | "VOID";
  voidReason: string | null;
  voidedAt: string | null;
  voidedById: number | null;
  journalEntryId: number | null;
};

const pad = (value: number, size = 4) => String(value).padStart(size, "0");

// ---------------------------------------------------------------------------
// Ibadah untuk pemilih di form kolekte. `/ddl/ibadah` belum ada di kontrak
// maupun di mock bersama; bentuknya mengikuti pilihan ddl lain.

const SUNDAY = 0;

const lastWeekday = (weekday: number, weeksBack: number) => {
  const today = new Date(`${TODAY}T00:00:00Z`).getUTCDay();
  const back = (today - weekday + 7) % 7;

  return addDays(TODAY, -back - weeksBack * 7);
};

export const IBADAH_OPTION = Array.from({ length: 10 }, (_, index) => ({
  id: index + 1,
  code: `IBD-${pad(index + 1)}`,
  name: index % 2 === 0 ? "Ibadah Minggu I" : "Ibadah Minggu II",
  date: lastWeekday(SUNDAY, Math.floor(index / 2)),
}));

const ibadahOf = (id: number | null) =>
  id === null ? null : (IBADAH_OPTION.find((row) => row.id === id) ?? null);

const jemaatOf = (id: number | null) =>
  id === null ? null : (DDL_JEMAAT.find((row) => row.id === id) ?? null);

const personOf = (id: number | null) => {
  const found = jemaatOf(id);

  return found ? { name: found.name } : null;
};

// ---------------------------------------------------------------------------
// Baris. Satu kolekte batch lengkap pada Minggu lalu, satu pembayaran online,
// satu dibatalkan sesudah diposting, sisanya pengisi supaya paginasi terisi.

const KOLEKTE_DATE = lastWeekday(SUNDAY, 1);

const GATEWAY_DATE = process.env.MOCK_GATEWAY_GIFT ? TODAY : addDays(TODAY, -4);

let sequence = 0;

const row = (
  seed: Partial<Row> & Pick<Row, "typePersembahanId" | "amount">,
): Row => {
  sequence += 1;

  return {
    id: sequence,
    publicId: `psb-${pad(sequence)}`,
    code: `PSB-${TODAY.slice(0, 4)}-${pad(sequence)}`,
    jemaatId: null,
    donorName: null,
    period: null,
    receiveMethod: "TUNAI",
    receivedDate: KOLEKTE_DATE,
    receivedById: 4,
    ibadahId: 3,
    status: "ACTIVE",
    voidReason: null,
    voidedAt: null,
    voidedById: null,
    journalEntryId: null,
    ...seed,
  };
};

const KOLEKTE_AMOUNTS = [
  "1250000",
  "480000",
  "375000",
  "2100000",
  "150000",
  "95000",
  "640000",
  "320000",
  "55000",
  "955000",
];

export const PERSEMBAHAN: Row[] = [
  // Kolekte batch minggu lalu: satu header, sepuluh amplop, sudah diposting.
  ...KOLEKTE_AMOUNTS.map((amount, index) =>
    row({
      typePersembahanId: 1,
      amount,
      donorName: index === 3 ? "Keluarga Sitompul" : null,
      journalEntryId: index === 0 ? 2 : null,
    }),
  ),
  // Perpuluhan bernama, wajib jemaat.
  ...DDL_JEMAAT.slice(0, 8).map((jemaat, index) =>
    row({
      typePersembahanId: 2,
      amount: String(500_000 + index * 125_000),
      jemaatId: jemaat.id,
      receiveMethod: index % 3 === 0 ? "TRANSFER" : "TUNAI",
      receivedDate: addDays(TODAY, -2 - index),
      ibadahId: null,
    }),
  ),
  // Persembahan bulanan: wajib jemaat dan berperiode.
  ...DDL_JEMAAT.slice(2, 8).map((jemaat, index) =>
    row({
      typePersembahanId: 3,
      amount: String(250_000 + index * 50_000),
      jemaatId: jemaat.id,
      period: startOfMonth(addDays(TODAY, -20)),
      receiveMethod: "TRANSFER",
      receivedDate: addDays(TODAY, -12 - index),
      ibadahId: null,
    }),
  ),
  // Syukur, anonim dan bernama.
  ...["3500000", "1750000", "250000", "80000"].map((amount, index) =>
    row({
      typePersembahanId: 4,
      amount,
      donorName: index === 1 ? "Ibu Tiur" : null,
      receivedDate: addDays(TODAY, -6 - index * 3),
      ibadahId: index === 0 ? 1 : null,
    }),
  ),
  // Dana pembangunan.
  ...["10000000", "4500000", "1200000"].map((amount, index) =>
    row({
      typePersembahanId: 5,
      amount,
      jemaatId: index === 0 ? 3 : null,
      donorName: index === 1 ? "Hamba Tuhan" : null,
      receiveMethod: "TRANSFER",
      receivedDate: addDays(TODAY, -8 - index * 4),
      ibadahId: null,
    }),
  ),
  // Pembayaran online: ditulis webhook, tidak bisa diketik; tanpa tangan yang memegang.
  row({
    typePersembahanId: 4,
    amount: "500000",
    jemaatId: 3,
    receiveMethod: "PAYMENT_GATEWAY",
    receivedDate: GATEWAY_DATE,
    receivedById: null,
    ibadahId: null,
  }),
  // Dibatalkan sesudah diposting: entri jurnalnya sudah dibalik.
  row({
    typePersembahanId: 1,
    amount: "620000",
    receivedDate: addDays(TODAY, -15),
    ibadahId: null,
    status: "VOID",
    voidReason: "Amplop terhitung dua kali saat penghitungan kolekte.",
    voidedAt: `${addDays(TODAY, -14)}T04:30:00.000Z`,
    voidedById: 6,
    journalEntryId: 5,
  }),
  // Dibatalkan sebelum diposting: tanpa jurnal sama sekali.
  row({
    typePersembahanId: 2,
    amount: "300000",
    jemaatId: 5,
    receivedDate: addDays(TODAY, -3),
    ibadahId: null,
    status: "VOID",
    voidReason: "Jemaat keliru ditunjuk; dicatat ulang atas nama yang benar.",
    voidedAt: `${addDays(TODAY, -3)}T09:15:00.000Z`,
    voidedById: 4,
  }),
];

const iso = (date: string | null) => (date ? `${date}T00:00:00.000Z` : null);

export const persembahanView = (item: Row) => {
  const type = typePersembahanOf(item.typePersembahanId);
  const jemaat = jemaatOf(item.jemaatId);
  const ibadah = ibadahOf(item.ibadahId);

  return {
    id: item.id,
    publicId: item.publicId,
    code: item.code,
    typePersembahan: {
      id: item.typePersembahanId,
      code: type?.code ?? "",
      name: type?.name ?? "",
      hasPeriod: type?.hasPeriod ?? false,
    },
    jemaat: jemaat
      ? { id: jemaat.id, code: jemaat.code, name: jemaat.name }
      : null,
    donorName: item.donorName,
    period: iso(item.period),
    amount: item.amount,
    receiveMethod: item.receiveMethod,
    receivedDate: iso(item.receivedDate),
    receivedBy: personOf(item.receivedById),
    ibadah: ibadah
      ? { id: ibadah.id, code: ibadah.code, date: iso(ibadah.date) }
      : null,
    status: item.status,
    voidReason: item.voidReason,
    voidedAt: item.voidedAt,
    voidedBy: personOf(item.voidedById),
    journal: journalRef(item.journalEntryId),
  };
};

const matches = (item: Row, params: URLSearchParams) => {
  const filter = (params.get("filter") ?? "").toLowerCase();
  const startDate = params.get("startDate");
  const endDate = params.get("endDate");
  const status = params.get("status");
  const method = params.get("receiveMethod");
  const typeId = Number(params.get("typePersembahanId")) || null;
  const isPosted = params.get("isPosted");
  const haystack = [
    item.code,
    jemaatOf(item.jemaatId)?.name ?? "",
    item.donorName ?? "",
  ]
    .join(" ")
    .toLowerCase();

  return (
    (!filter || haystack.includes(filter)) &&
    (!startDate || item.receivedDate >= startDate) &&
    (!endDate || item.receivedDate <= endDate) &&
    (!status || item.status === status) &&
    (!method || item.receiveMethod === method) &&
    (!typeId || item.typePersembahanId === typeId) &&
    (isPosted === null ||
      !/^(1|0|true|false)$/i.test(isPosted) ||
      /^(1|true)$/i.test(isPosted) === (item.journalEntryId !== null))
  );
};

export const persembahanList = (params: URLSearchParams) =>
  PERSEMBAHAN.filter((item) => matches(item, params)).sort(
    (a, b) => b.receivedDate.localeCompare(a.receivedDate) || b.id - a.id,
  );

export const persembahanTotals = (rows: readonly Row[]) =>
  String(
    rows
      .filter((item) => item.status === "ACTIVE")
      .reduce((total, item) => total + Number(item.amount), 0),
  );

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

  const saved = items.map((item) =>
    row({
      typePersembahanId: Number(item.typePersembahanId),
      jemaatId: numberOf(item.jemaatId),
      period: textOf(item.period)?.slice(0, 10) ?? null,
      donorName: nameOf(item.donorName),
      amount: String(item.amount),
      receiveMethod,
      receivedDate,
      receivedById: numberOf(body.receivedBy),
      ibadahId,
    }),
  );

  PERSEMBAHAN.push(...saved);

  return json(
    {
      status: 201,
      message: `Berhasil Mencatat ${saved.length} Persembahan`,
      data: saved.map(persembahanView),
    },
    201,
  );
};

const voidOne = async (request: Request, item: Row) => {
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

  // Pembalikan bertanggal hari ini, jadi bulan ini yang harus terbuka.
  if (item.journalEntryId !== null) {
    const period = periodRefusal(TODAY);

    if (period) return period;
  }

  item.status = "VOID";
  item.voidReason = reason;
  item.voidedAt = new Date().toISOString();
  item.voidedById = 4;

  return json({
    status: 200,
    message: "Berhasil Membatalkan Persembahan",
    data: persembahanView(item),
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
    const response = list(
      rows.map(persembahanView),
      url,
      "Persembahan",
      "Persembahan",
    );

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
      data: persembahanView(item),
    });
  }

  return null;
};
