/**
 * Tiruan `/api/v1/pembayaran` (be-sada `modules/pembayaran`) plus
 * `POST /jurnal/posting-pembayaran`. Larik `PAYMENT` milik handler ini.
 *
 * Layar staf hanya membaca: pembuatan invoice selalu sesi jemaat, dan tidak ada
 * reissue maupun refund. POST/PUT/DELETE lain karena itu 404, bukan 405.
 *
 * Daftar di-scope ke sesi: pemegang PEMBAYARAN VIEW yang bukan bendahara hanya
 * melihat pembayarannya sendiri, karena nama pemberi dan nominalnya hanya boleh
 * dibaca bendahara dan pemberinya.
 *
 *   MOCK_EMPTY=1            → daftar kosong (404)
 *   MOCK_500=1              → daftar menjawab 500
 *   MOCK_STALE_PENDING=1    → baris PENDING sudah lewat `expiredAt`
 *   MOCK_PERIOD_CLOSED=1    → posting ditolak: periodenya tertutup
 *   MOCK_SETTING_EMPTY=1    → posting ditolak: setelan akuntansi belum diisi
 */
import { MENU } from "../../../src/config/menu";
import { addDays } from "../../../src/lib/date";
import { DDL_JEMAAT } from "../../mock-dashboard";
import {
  PERSEMBAHAN,
  TODAY,
  accountOf,
  codeOf,
  dayInMonth,
  isLive,
  journalOfSource,
  monthLabel,
  periodOf,
  postDocumentEntry,
  settingAccountOf,
  typePersembahanOf,
  type PostFailure,
} from "../keuangan-store";
import { denied, json, list, readBody, type MockHandler } from "../kit";

const NOT_FOUND = "Pembayaran Tidak Ditemukan";

const SOURCE_TYPE = "EVENT_REGISTRATION";

const GATEWAY_KEY = "PERSEMBAHAN_GATEWAY";

const INCOME_KEY = "PENDAPATAN_EVENT";

const MAX_RANGE_DAYS = 31;

// Sesi mock selalu JMT-0012; scoping diuji lewat nomor ini, bukan lewat persona.
const SESSION_JEMAAT_ID = 12;

type Purpose = "PERSEMBAHAN" | "EVENT_REGISTRATION";

type PaymentRow = {
  id: number;
  publicId: string;
  code: string;
  purpose: Purpose;
  amount: string;
  status: "PENDING" | "PAID" | "EXPIRED" | "FAILED" | "CANCELLED";
  method: string | null;
  paidAt: string | null;
  expiredAt: string | null;
  createdAt: string;
  jemaatId: number | null;
  donorName: string | null;
  typePersembahanId: number | null;
  period: string | null;
  persembahanId: number | null;
};

const pad = (value: number) => String(value).padStart(4, "0");

const at = (back: number, hour = "03") =>
  `${addDays(TODAY, -back)}T${hour}:15:00.000Z`;

// Yang bisa diposting harus jatuh di bulan berjalan: layar posting membuka
// bulan ini, dan seed yang menyeberang bulan membuat pratinjau kosong di awal bulan.
const inMonth = (back: number, hour = "03") =>
  `${dayInMonth(back)}T${hour}:15:00.000Z`;

const GATEWAY_GIFT =
  PERSEMBAHAN.find((row) => row.receiveMethod === "PAYMENT_GATEWAY") ?? null;

const PENDING_EXPIRY = process.env.MOCK_STALE_PENDING ? at(2) : at(-1);

const payment = (
  id: number,
  seed: Partial<PaymentRow> & Pick<PaymentRow, "purpose" | "amount">,
): PaymentRow => ({
  id,
  publicId: `pay-${pad(id)}`,
  code: codeOf("PAY", { yearly: true }),
  status: "PENDING",
  method: null,
  paidAt: null,
  expiredAt: null,
  createdAt: at(1),
  jemaatId: null,
  donorName: null,
  typePersembahanId: null,
  period: null,
  persembahanId: null,
  ...seed,
});

export const PAYMENT: PaymentRow[] = [
  payment(1, {
    purpose: "PERSEMBAHAN",
    amount: "350000",
    jemaatId: 12,
    typePersembahanId: 2,
    createdAt: at(1),
    expiredAt: PENDING_EXPIRY,
  }),
  payment(2, {
    purpose: "PERSEMBAHAN",
    amount: GATEWAY_GIFT?.amount ?? "500000",
    status: "PAID",
    method: "QRIS",
    jemaatId: GATEWAY_GIFT?.jemaatId ?? 3,
    typePersembahanId: GATEWAY_GIFT?.typePersembahanId ?? 4,
    createdAt: at(5),
    paidAt: at(4),
    persembahanId: GATEWAY_GIFT?.id ?? null,
  }),
  payment(3, {
    purpose: "PERSEMBAHAN",
    amount: "150000",
    status: "PAID",
    method: "Transfer bank",
    donorName: "Hamba Tuhan",
    typePersembahanId: 1,
    createdAt: at(1, "01"),
    paidAt: at(1, "02"),
  }),
  payment(4, {
    purpose: "EVENT_REGISTRATION",
    amount: "350000",
    status: "PAID",
    method: "QRIS",
    jemaatId: 7,
    createdAt: inMonth(8),
    paidAt: inMonth(7),
  }),
  payment(5, {
    purpose: "EVENT_REGISTRATION",
    amount: "700000",
    status: "PAID",
    method: "Kartu debit",
    jemaatId: 10,
    createdAt: inMonth(6),
    paidAt: inMonth(6, "05"),
  }),
  payment(6, {
    purpose: "PERSEMBAHAN",
    amount: "250000",
    status: "EXPIRED",
    donorName: "Keluarga Sitompul",
    typePersembahanId: 1,
    createdAt: at(12),
    expiredAt: at(11),
  }),
  payment(7, {
    purpose: "PERSEMBAHAN",
    amount: "1000000",
    status: "FAILED",
    method: "Kartu debit",
    jemaatId: 4,
    typePersembahanId: 3,
    period: `${TODAY.slice(0, 7)}-01`,
    createdAt: at(9),
  }),
  payment(8, {
    purpose: "EVENT_REGISTRATION",
    amount: "350000",
    status: "CANCELLED",
    jemaatId: 2,
    createdAt: inMonth(20),
  }),
];

const jemaatOf = (id: number | null) =>
  id === null ? null : (DDL_JEMAAT.find((row) => row.id === id) ?? null);

const persembahanOf = (id: number | null) =>
  id === null ? null : (PERSEMBAHAN.find((row) => row.id === id) ?? null);

// `journalRefOfSource` belum membawa publicId, sedangkan rute jurnal hanya
// menerima publicId — jadi tautannya dibangun dari entrinya sendiri.
const journalRefOf = (row: PaymentRow) => {
  const entry = journalOfSource(SOURCE_TYPE, row.id);

  return entry
    ? { publicId: entry.publicId, code: entry.code, status: entry.status }
    : null;
};

export const paymentView = (row: PaymentRow) => {
  const jemaat = jemaatOf(row.jemaatId);
  const type = typePersembahanOf(row.typePersembahanId);
  const gift = persembahanOf(row.persembahanId);

  return {
    id: row.id,
    publicId: row.publicId,
    code: row.code,
    purpose: row.purpose,
    amount: row.amount,
    status: row.status,
    method: row.method,
    paidAt: row.paidAt,
    expiredAt: row.expiredAt,
    createdAt: row.createdAt,
    jemaat: jemaat
      ? {
          publicId: `jmt-${pad(jemaat.id)}`,
          code: jemaat.code,
          name: jemaat.name,
        }
      : null,
    donorName: row.donorName,
    typePersembahan: type ? { code: type.code, name: type.name } : null,
    period: row.period ? `${row.period}T00:00:00.000Z` : null,
    persembahan: gift ? { code: gift.code } : null,
    journal: journalRefOf(row),
  };
};

const dateOf = (row: PaymentRow) => (row.paidAt ?? row.createdAt).slice(0, 10);

const matches = (row: PaymentRow, params: URLSearchParams) => {
  const filter = (params.get("filter") ?? "").toLowerCase();
  const startDate = params.get("startDate");
  const endDate = params.get("endDate");
  const status = params.get("status");
  const purpose = params.get("purpose");
  const date = dateOf(row);
  const giver = (
    jemaatOf(row.jemaatId)?.name ??
    row.donorName ??
    ""
  ).toLowerCase();

  return (
    (!status || row.status === status) &&
    (!purpose || row.purpose === purpose) &&
    (!startDate || date >= startDate) &&
    (!endDate || date <= endDate) &&
    (!filter ||
      row.code.toLowerCase().includes(filter) ||
      giver.includes(filter))
  );
};

const listRows = (url: URL, isTreasury: boolean) =>
  PAYMENT.filter(
    (row) =>
      (isTreasury || row.jemaatId === SESSION_JEMAAT_ID) &&
      matches(row, url.searchParams),
  )
    .sort((a, b) => dateOf(b).localeCompare(dateOf(a)) || b.id - a.id)
    .map(paymentView);

const fail = (status: number, error: string, code?: string) =>
  json(code ? { status, error, code } : { status, error }, status);

const fieldError = (path: string, message: string) =>
  json({ status: 400, error: message, issues: [{ path, message }] }, 400);

// Cermin `postDocumentEntry`: pratinjau tidak boleh menjanjikan lebih daripada
// yang benar-benar ditulis saat posting sungguhan.
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

type Setup = { debitId: number; creditId: number };

// Uang gateway masuk ke akun aset transit, bukan bank; sisi kreditnya pendapatan
// pendaftaran event.
const setupOf = (): { failure: PostFailure } | Setup => {
  const pairs = [
    [GATEWAY_KEY, settingAccountOf(GATEWAY_KEY)],
    [INCOME_KEY, settingAccountOf(INCOME_KEY)],
  ] as const;

  for (const [key, accountId] of pairs) {
    if (accountId === null || process.env.MOCK_SETTING_EMPTY) {
      return {
        failure: {
          code: "SETTING_EMPTY",
          message: `Setelan Akuntansi ${key} Belum Diisi. Tetapkan Akunnya Terlebih Dahulu`,
        },
      };
    }

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

  return { debitId: pairs[0][1] as number, creditId: pairs[1][1] as number };
};

const postEntry = (row: PaymentRow, setup: Setup) =>
  postDocumentEntry({
    sourceType: SOURCE_TYPE,
    sourceId: row.id,
    entryDate: dateOf(row),
    description: `Pendaftaran event ${row.code}`,
    lines: [
      { accountId: setup.debitId, debit: row.amount, credit: "0" },
      { accountId: setup.creditId, debit: "0", credit: row.amount },
    ],
  });

const daysBetween = (from: string, to: string) =>
  Math.round(
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) /
      86400000,
  ) + 1;

const postableIn = (from: string, to: string) =>
  PAYMENT.filter(
    (row) =>
      row.purpose === "EVENT_REGISTRATION" &&
      row.status === "PAID" &&
      dateOf(row) >= from &&
      dateOf(row) <= to,
  );

const onPost = (url: URL, body: { from?: unknown; to?: unknown }) => {
  const dryRun = url.searchParams.get("dryRun");

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

  const refused: { code: string; reason: string; reasonCode: string }[] = [];
  const setup = setupOf();
  let posted = 0;
  let skipped = 0;

  const onRefused = (row: PaymentRow, failure: PostFailure) =>
    refused.push({
      code: row.code,
      reason: failure.message,
      reasonCode: failure.code,
    });

  for (const row of postableIn(from, to)) {
    if (journalOfSource(SOURCE_TYPE, row.id)) {
      skipped += 1;
      continue;
    }
    if ("failure" in setup) {
      onRefused(row, setup.failure);
      continue;
    }

    if (isDryRun) {
      const failure = periodFailureOf(dateOf(row));

      if (failure) onRefused(row, failure);
      else posted += 1;

      continue;
    }

    const result = postEntry(row, setup);

    if ("failure" in result) {
      if (result.failure.code === "ALREADY_POSTED") skipped += 1;
      else onRefused(row, result.failure);

      continue;
    }

    posted += 1;
  }

  return json(
    {
      status: isDryRun ? 200 : 201,
      message: isDryRun
        ? "Berhasil Memeriksa Posting Pembayaran"
        : "Berhasil Memposting Pembayaran Ke Jurnal",
      data: { posted, skipped, refused },
    },
    isDryRun ? 200 : 201,
  );
};

export const pembayaranMock: MockHandler = async (ctx) => {
  const { path, method, url, request, can } = ctx;

  if (path === "/jurnal/posting-pembayaran") {
    if (method !== "POST") return null;

    return can(MENU.JURNAL, "CREATE")
      ? onPost(url, await readBody(request))
      : denied();
  }

  if (path !== "/pembayaran" && !path.startsWith("/pembayaran/")) return null;
  if (method !== "GET") return fail(404, NOT_FOUND);
  if (!can(MENU.PEMBAYARAN, "VIEW")) return denied();

  const isTreasury = ctx.isAdmin || can(MENU.PERSEMBAHAN, "VIEW");

  if (path === "/pembayaran") {
    if (process.env.MOCK_500) return fail(500, "Internal Server Error");

    return list(listRows(url, isTreasury), url, "Pembayaran", "Pembayaran");
  }

  const key = decodeURIComponent(path.slice("/pembayaran/".length));
  const row = PAYMENT.find(
    (item) =>
      item.publicId === key &&
      (isTreasury || item.jemaatId === SESSION_JEMAAT_ID),
  );

  return row
    ? json({
        status: 200,
        message: "Berhasil Mendapatkan Pembayaran",
        data: paymentView(row),
      })
    : fail(404, NOT_FOUND);
};
