/**
 * Tiruan `/api/v1/setoran` (kontrak Keuangan §12). Larik `CASH_TRANSFER` milik
 * handler ini; jurnalnya ditulis store lewat satu pintu — D akun tujuan /
 * K akun asal — dengan `sourceType: "CASH_TRANSFER"`.
 *
 *   MOCK_EMPTY=1           → daftar kosong (404)
 *   MOCK_500=1             → daftar menjawab 500
 *   MOCK_PERIOD_CLOSED=1   → setor ditolak karena periodenya tertutup
 */
import { MENU } from "../../../src/config/menu";
import type { AccountType, CashStatus } from "../../../src/types/keuangan";
import {
  TODAY,
  accountOf,
  accountRef,
  codeOf,
  dayInMonth,
  isLive,
  journalRefOfSource,
  postDocumentEntry,
  reverseDocumentEntry,
} from "../keuangan-store";
import {
  denied,
  json,
  list,
  readBody,
  type MockAction,
  type MockContext,
  type MockHandler,
} from "../kit";

type TransferRow = {
  id: number;
  publicId: string;
  code: string;
  transferDate: string;
  fromAccountId: number;
  toAccountId: number;
  amount: string;
  description: string;
  reference: string | null;
  status: CashStatus;
};

type Issue = { path: string; message: string };

const NOT_FOUND = "Setoran Tidak Ditemukan";

const SOURCE_TYPE = "CASH_TRANSFER";

const pad = (value: number) => String(value).padStart(4, "0");

const nextIdOf = (rows: readonly { id: number }[]) =>
  Math.max(0, ...rows.map((row) => row.id)) + 1;

const transfer = (
  id: number,
  transferDate: string,
  fromAccountId: number,
  toAccountId: number,
  amount: string,
  description: string,
  extra: Partial<TransferRow> = {},
): TransferRow => ({
  id,
  publicId: `str-${pad(id)}`,
  code: codeOf("STR", { yearly: true }),
  transferDate,
  fromAccountId,
  toAccountId,
  amount,
  description,
  reference: null,
  status: "DRAFT",
  ...extra,
});

export const CASH_TRANSFER: TransferRow[] = [
  transfer(
    1,
    dayInMonth(1),
    2,
    4,
    "6420000",
    "Setoran kolekte Minggu ke bank",
    {
      reference: "SLIP-0098",
    },
  ),
  transfer(
    2,
    dayInMonth(4),
    4,
    3,
    "1500000",
    "Isi kas kecil untuk operasional",
    {
      status: "PAID",
    },
  ),
  transfer(3, dayInMonth(11), 2, 5, "2000000", "Setoran dana pembangunan", {
    status: "CANCELLED",
    reference: "SLIP-0091",
  }),
];

const entryDescriptionOf = (row: TransferRow) => `Setoran ${row.code}`;

const reversalDescriptionOf = (row: TransferRow) =>
  `Pembalikan setoran ${row.code}`;

// D akun tujuan / K akun asal: uang berpindah, tidak bertambah atau berkurang.
const entryLinesOf = (row: TransferRow) => [
  { accountId: row.toAccountId, debit: row.amount, credit: "0" },
  { accountId: row.fromAccountId, debit: "0", credit: row.amount },
];

const postEntry = (row: TransferRow) =>
  postDocumentEntry({
    sourceType: SOURCE_TYPE,
    sourceId: row.id,
    entryDate: row.transferDate,
    description: entryDescriptionOf(row),
    lines: entryLinesOf(row),
  });

// Setoran batal selalu lahir dari yang sudah disetor: pembukuannya ikut lahir.
for (const row of CASH_TRANSFER.filter((item) => item.status !== "DRAFT")) {
  postEntry(row);
  if (row.status === "CANCELLED") {
    reverseDocumentEntry(SOURCE_TYPE, row.id, reversalDescriptionOf(row));
  }
}

export const cashTransferView = (row: TransferRow) => ({
  id: row.id,
  publicId: row.publicId,
  code: row.code,
  transferDate: `${row.transferDate}T00:00:00.000Z`,
  fromAccountId: row.fromAccountId,
  toAccountId: row.toAccountId,
  fromAccount: accountRef(row.fromAccountId),
  toAccount: accountRef(row.toAccountId),
  amount: row.amount,
  description: row.description,
  reference: row.reference,
  bapel: null,
  status: row.status,
  method: null,
  journal: journalRefOfSource(SOURCE_TYPE, row.id),
});

const failure = (status: number, error: string, code?: string) =>
  json(code ? { status, error, code } : { status, error }, status);

const invalid = (issues: Issue[], status = 400, code?: string) =>
  json({ status, error: issues[0].message, code, issues }, status);

const findRow = (code: string) => {
  const lower = decodeURIComponent(code).toLowerCase();

  return CASH_TRANSFER.find((row) => row.code.toLowerCase() === lower);
};

const ok = (message: string, row: TransferRow, status = 200) =>
  json({ status, message, data: cashTransferView(row) }, status);

type Parsed = {
  transferDate: string;
  fromAccountId: number;
  toAccountId: number;
  amount: string;
  description: string;
  reference: string | null;
};

const textOf = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

function parse(body: Record<string, unknown>): Parsed | Issue[] {
  const issues: Issue[] = [];
  const transferDate = textOf(body.transferDate).slice(0, 10);
  const amount = textOf(body.amount);
  const description = textOf(body.description);
  const fromAccountId = Number(body.fromAccountId);
  const toAccountId = Number(body.toAccountId);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(transferDate)) {
    issues.push({
      path: "transferDate",
      message: "Mohon Lengkapi Tanggal Setoran",
    });
  } else if (transferDate > TODAY) {
    issues.push({
      path: "transferDate",
      message: "Tanggal Setoran Tidak Boleh Di Masa Depan",
    });
  }
  if (!fromAccountId) {
    issues.push({ path: "fromAccountId", message: "Mohon Lengkapi Akun Asal" });
  }
  if (!toAccountId) {
    issues.push({ path: "toAccountId", message: "Mohon Lengkapi Akun Tujuan" });
  }
  if (!amount || Number(amount) <= 0) {
    issues.push({
      path: "amount",
      message: "Jumlah Setoran Harus Lebih Dari 0",
    });
  }
  if (!description) {
    issues.push({ path: "description", message: "Mohon Lengkapi Keterangan" });
  }

  if (issues.length > 0) return issues;

  return {
    transferDate,
    fromAccountId,
    toAccountId,
    amount,
    description,
    reference: textOf(body.reference) || null,
  };
}

const ACCOUNT_FIELD = {
  fromAccountId: "fromAccountId",
  toAccountId: "toAccountId",
} as const;

function accountFailure(parsed: Parsed): Response | null {
  if (parsed.fromAccountId === parsed.toAccountId) {
    return invalid([
      {
        path: ACCOUNT_FIELD.toAccountId,
        message: "Akun Tujuan Harus Berbeda Dari Akun Asal",
      },
    ]);
  }

  const pairs = [
    [ACCOUNT_FIELD.fromAccountId, parsed.fromAccountId],
    [ACCOUNT_FIELD.toAccountId, parsed.toAccountId],
  ] as const;

  const missing = pairs.flatMap(([path, id]) => {
    const row = accountOf(id);

    return row && isLive(row)
      ? []
      : [{ path, message: "Akun Tidak Ditemukan" }];
  });
  if (missing.length > 0) return invalid(missing, 404);

  const inactive = pairs.flatMap(([path, id]) =>
    accountOf(id)?.isActive
      ? []
      : [{ path, message: `Akun ${accountOf(id)?.code} Tidak Aktif` }],
  );
  if (inactive.length > 0) return invalid(inactive, 400, "ACCOUNT_INACTIVE");

  const wrongType = pairs.flatMap(([path, id]) =>
    accountOf(id)?.type === ("ASSET" satisfies AccountType)
      ? []
      : [{ path, message: "Akun Harus Bertipe Aset" }],
  );
  if (wrongType.length > 0) return invalid(wrongType);

  return null;
}

const onCreate = async (ctx: MockContext) => {
  const parsed = parse(await readBody<Record<string, unknown>>(ctx.request));
  if (Array.isArray(parsed)) return invalid(parsed);

  const rejected = accountFailure(parsed);
  if (rejected) return rejected;

  const id = nextIdOf(CASH_TRANSFER);
  const row = transfer(
    id,
    parsed.transferDate,
    parsed.fromAccountId,
    parsed.toAccountId,
    parsed.amount,
    parsed.description,
    { reference: parsed.reference },
  );

  CASH_TRANSFER.push(row);

  return ok("Berhasil Mencatat Setoran", row, 201);
};

export function postTransfer(row: TransferRow) {
  if (row.status === "CANCELLED") {
    return failure(400, "Setoran Ini Sudah Dibatalkan");
  }
  if (row.status !== "DRAFT") return failure(400, "Setoran Ini Sudah Disetor");

  const rejectedAccount = accountFailure(row);
  if (rejectedAccount) return rejectedAccount;

  const posted = postEntry(row);

  if ("failure" in posted) {
    return failure(400, posted.failure.message, posted.failure.code);
  }

  row.status = "PAID";

  return ok("Berhasil Menyetor Setoran", row);
}

const onCancel = async (ctx: MockContext, row: TransferRow) => {
  const body = await readBody<Record<string, unknown>>(ctx.request);
  const reason = textOf(body.reason);

  if (row.status === "DRAFT") {
    return failure(400, "Setoran Yang Masih Draft Tidak Perlu Dibatalkan");
  }
  if (row.status === "CANCELLED") {
    return failure(400, "Setoran Ini Sudah Dibatalkan");
  }
  if (!reason) {
    return invalid([{ path: "reason", message: "Mohon Lengkapi Alasan" }]);
  }

  const reversed = reverseDocumentEntry(
    SOURCE_TYPE,
    row.id,
    reversalDescriptionOf(row),
  );

  if (reversed && "failure" in reversed) {
    return failure(400, reversed.failure.message, reversed.failure.code);
  }

  row.status = "CANCELLED";

  return ok("Berhasil Membatalkan Setoran", row);
};

const listRows = (url: URL) => {
  const params = url.searchParams;
  const status = params.get("status");
  const startDate = params.get("startDate");
  const endDate = params.get("endDate");
  const filter = (params.get("filter") ?? "").toLowerCase();

  return CASH_TRANSFER.filter(
    (row) =>
      (!status || row.status === status) &&
      (!startDate || row.transferDate >= startDate) &&
      (!endDate || row.transferDate <= endDate) &&
      (!filter ||
        row.code.toLowerCase().includes(filter) ||
        row.description.toLowerCase().includes(filter) ||
        (row.reference ?? "").toLowerCase().includes(filter)),
  )
    .sort((a, b) => b.transferDate.localeCompare(a.transferDate) || b.id - a.id)
    .map(cashTransferView);
};

export const setoranMock: MockHandler = async (ctx) => {
  const match = ctx.path.match(/^\/setoran(?:\/([^/]+))?(?:\/(setor|batal))?$/);
  if (!match) return null;

  const [, code, actionName] = match;
  const can = (action: MockAction) => ctx.can(MENU.BANK_DEPOSIT, action);

  if (actionName) {
    if (ctx.method !== "PUT") return null;
    if (!can(actionName === "setor" ? "CREATE" : "DELETE")) return denied();

    const row = findRow(code ?? "");
    if (!row) return failure(404, NOT_FOUND);

    return actionName === "setor" ? postTransfer(row) : onCancel(ctx, row);
  }

  if (ctx.method === "GET") {
    if (!can("VIEW")) return denied();

    if (!code) {
      if (process.env.MOCK_500) return failure(500, "Internal Server Error");

      return list(listRows(ctx.url), ctx.url, "Setoran", "Setoran");
    }

    const row = findRow(code);

    return row
      ? ok("Berhasil Mendapatkan Setoran", row)
      : failure(404, NOT_FOUND);
  }

  if (ctx.method === "POST" && !code) {
    return can("CREATE") ? onCreate(ctx) : denied();
  }

  return null;
};
