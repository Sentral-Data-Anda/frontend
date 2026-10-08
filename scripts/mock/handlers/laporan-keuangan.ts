/**
 * Tiruan `/api/v1/laporan-keuangan` (be-sada `modules/laporan_keuangan`) di atas
 * JOURNAL_ENTRY dan ACCOUNT store Keuangan. Ketiganya menjawab 200 dengan nol,
 * tidak pernah 404 saat kosong; akun yang tidak ada di buku besar tetap 404.
 *
 *   MOCK_EMPTY=1       → semua angka nol, tetap 200
 *   MOCK_NO_OPENING=1  → neraca menandai saldo awal belum dimasukkan
 *   MOCK_UNBALANCED=1  → neraca menjawab balanced: false
 *   MOCK_500=1         → semua laporan menjawab 500
 */
import { MENU } from "../../../src/config/menu";
import type { AccountType } from "../../../src/types/keuangan";
import {
  ACCOUNT,
  JOURNAL_ENTRY,
  isLive,
  journalView,
  type AccountRow,
  type JournalEntryRow,
  type JournalLineRow,
} from "../keuangan-store";
import { denied, json, paging, type MockHandler } from "../kit";

const DEBIT_NORMAL: ReadonlySet<AccountType> = new Set<AccountType>([
  "ASSET",
  "EXPENSE",
]);

const centsOf = (value: string) => {
  const [whole, fraction = ""] = String(value ?? "0").split(".");

  return Number(whole || "0") * 100 + Number(`${fraction}00`.slice(0, 2));
};

const amountOf = (cents: number) => {
  const sign = cents < 0 ? "-" : "";
  const size = Math.abs(cents);
  const fraction = size % 100;

  return fraction === 0
    ? `${sign}${Math.trunc(size / 100)}`
    : `${sign}${Math.trunc(size / 100)}.${String(fraction).padStart(2, "0")}`;
};

const sideOf = (type: AccountType, debit: number, credit: number) =>
  DEBIT_NORMAL.has(type) ? debit - credit : credit - debit;

const utc = (date: string) => `${date}T00:00:00.000Z`;

const isDateValid = (value: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));

const liveAccounts = () => ACCOUNT.filter((row) => isLive(row));

type Posting = { entry: JournalEntryRow; line: JournalLineRow };

const postings = (from: string | null, to: string): Posting[] => {
  if (process.env.MOCK_EMPTY) return [];

  return JOURNAL_ENTRY.filter(
    (entry) =>
      entry.status === "POSTED" &&
      entry.entryDate <= to &&
      (from === null || entry.entryDate >= from),
  ).flatMap((entry) => entry.lines.map((line) => ({ entry, line })));
};

type Balance = Pick<
  AccountRow,
  "id" | "code" | "name" | "type" | "netAssetClass" | "cashFlowCategory"
> & {
  parentAccountId: number | null;
  cents: number;
};

type Node = Balance & { total: number; children: Node[] };

const balancesFor = (from: string | null, to: string): Balance[] => {
  const debit = new Map<number, number>();
  const credit = new Map<number, number>();

  for (const { line } of postings(from, to)) {
    debit.set(
      line.accountId,
      (debit.get(line.accountId) ?? 0) + centsOf(line.debit),
    );
    credit.set(
      line.accountId,
      (credit.get(line.accountId) ?? 0) + centsOf(line.credit),
    );
  }

  return liveAccounts().map((row) => ({
    id: row.id,
    code: row.code,
    name: row.name,
    type: row.type,
    parentAccountId: row.parentAccountId,
    netAssetClass: row.netAssetClass,
    cashFlowCategory: row.cashFlowCategory,
    cents: sideOf(row.type, debit.get(row.id) ?? 0, credit.get(row.id) ?? 0),
  }));
};

/** Null dibaca TANPA_PEMBATASAN — cermin `classOf` di server. */
const classOf = (row: { netAssetClass: AccountRow["netAssetClass"] }) =>
  row.netAssetClass ?? "TANPA_PEMBATASAN";

const derivedCashFlowOf = (type: AccountType) => {
  if (type === "INCOME" || type === "EXPENSE") return "OPERASI";
  if (type === "ASSET") return "INVESTASI";

  return "PENDANAAN";
};

const cashFlowOf = (row: {
  type: AccountType;
  cashFlowCategory: AccountRow["cashFlowCategory"];
}) => row.cashFlowCategory ?? derivedCashFlowOf(row.type);

/**
 * Saldo LEAF per kelas, bukan pohonnya.
 *
 * Total sebuah akun induk sudah memuat anak-anaknya, jadi menjumlahkan node
 * akan menghitung tiap angka dua kali — cermin `byClass` di server.
 */
const byClass = (rows: readonly Balance[], types: readonly AccountType[]) => {
  let tanpaPembatasan = 0;
  let denganPembatasan = 0;

  for (const row of rows) {
    if (!types.includes(row.type)) continue;

    if (classOf(row) === "DENGAN_PEMBATASAN") denganPembatasan += row.cents;
    else tanpaPembatasan += row.cents;
  }

  return {
    tanpaPembatasan,
    denganPembatasan,
    total: tanpaPembatasan + denganPembatasan,
  };
};

type ByClass = ReturnType<typeof byClass>;

const classView = (value: ByClass) => ({
  tanpaPembatasan: amountOf(value.tanpaPembatasan),
  denganPembatasan: amountOf(value.denganPembatasan),
  total: amountOf(value.total),
});

const combine = (left: ByClass, right: ByClass, sign: 1 | -1): ByClass => ({
  tanpaPembatasan: left.tanpaPembatasan + sign * right.tanpaPembatasan,
  denganPembatasan: left.denganPembatasan + sign * right.denganPembatasan,
  total: left.total + sign * right.total,
});

const dayBefore = (date: string) => {
  const previous = new Date(`${date}T00:00:00.000Z`);
  previous.setUTCDate(previous.getUTCDate() - 1);

  return previous.toISOString().slice(0, 10);
};

const byCode = (a: Node, b: Node) => a.code.localeCompare(b.code);

const rollUp = (rows: readonly Balance[]): Node[] => {
  const nodes = new Map<number, Node>(
    rows.map((row) => [row.id, { ...row, total: row.cents, children: [] }]),
  );
  const roots: Node[] = [];

  for (const node of nodes.values()) {
    const parent =
      node.parentAccountId === null
        ? undefined
        : nodes.get(node.parentAccountId);

    if (parent) parent.children.push(node);
    else roots.push(node);
  }

  const totalOf = (node: Node): number => {
    node.total = node.children.reduce(
      (sum, child) => sum + totalOf(child),
      node.cents,
    );
    node.children.sort(byCode);

    return node.total;
  };

  for (const root of roots) totalOf(root);

  return roots.sort(byCode);
};

const treeOf = (rows: readonly Balance[], type: AccountType) =>
  rollUp(rows.filter((row) => row.type === type));

const nodeView = (node: Node): unknown => ({
  id: node.id,
  code: node.code,
  name: node.name,
  type: node.type,
  total: amountOf(node.total),
  children: node.children.map(nodeView),
});

const sumOf = (nodes: readonly Node[]) =>
  nodes.reduce((total, node) => total + node.total, 0);

const serverError = () =>
  json({ status: 500, error: "Internal Server Error" }, 500);

const issue = (path: string, message: string) =>
  json({ status: 400, error: message, issues: [{ path, message }] }, 400);

const readDate = (url: URL, key: string, missing: string) => {
  const value = (url.searchParams.get(key) ?? "").trim();

  return isDateValid(value) ? value : { failure: issue(key, missing) };
};

const readRange = (url: URL) => {
  const from = readDate(url, "from", "Mohon Lengkapi Tanggal Mulai");
  if (typeof from !== "string") return from;

  const to = readDate(url, "to", "Mohon Lengkapi Tanggal Selesai");
  if (typeof to !== "string") return to;

  if (to < from) {
    return {
      failure: issue("to", "Tanggal Selesai tidak boleh sebelum Tanggal Mulai"),
    };
  }

  return { from, to };
};

// Entri pembalik juga MANUAL, jadi ia tidak boleh dibaca sebagai saldo awal.
const isOpeningEnteredAt = (date: string) =>
  !process.env.MOCK_NO_OPENING &&
  !process.env.MOCK_EMPTY &&
  JOURNAL_ENTRY.some(
    (entry) =>
      entry.status === "POSTED" &&
      entry.sourceType === "MANUAL" &&
      entry.reversalOfId === null &&
      entry.entryDate <= date,
  );

const onNeraca = (url: URL) => {
  const date = readDate(url, "date", "Mohon Lengkapi Tanggal Laporan");
  if (typeof date !== "string") return date.failure;

  const balances = balancesFor(null, date);
  const assets = treeOf(balances, "ASSET");
  const liabilities = treeOf(balances, "LIABILITY");
  const equity = treeOf(balances, "EQUITY");
  const surplus =
    sumOf(treeOf(balances, "INCOME")) - sumOf(treeOf(balances, "EXPENSE"));
  const totals = {
    assets: sumOf(assets),
    liabilities: sumOf(liabilities),
    equity: sumOf(equity),
    surplus,
  };

  return json({
    status: 200,
    message: "Berhasil Mendapatkan Neraca",
    data: {
      date: utc(date),
      assets: assets.map(nodeView),
      liabilities: liabilities.map(nodeView),
      equity: equity.map(nodeView),
      totals: {
        assets: amountOf(totals.assets),
        liabilities: amountOf(totals.liabilities),
        equity: amountOf(totals.equity),
        surplus: amountOf(totals.surplus),
      },
      netAssets: classView(
        combine(
          byClass(balances, ["EQUITY"]),
          combine(
            byClass(balances, ["INCOME"]),
            byClass(balances, ["EXPENSE"]),
            -1,
          ),
          1,
        ),
      ),
      balanced:
        !process.env.MOCK_UNBALANCED &&
        totals.assets === totals.liabilities + totals.equity + totals.surplus,
      isOpeningEntered: isOpeningEnteredAt(date),
    },
  });
};

const onSurplusDefisit = (url: URL) => {
  const range = readRange(url);
  if ("failure" in range) return range.failure;

  const balances = balancesFor(range.from, range.to);
  const income = treeOf(balances, "INCOME");
  const expense = treeOf(balances, "EXPENSE");

  return json({
    status: 200,
    message: "Berhasil Mendapatkan Laporan Surplus Defisit",
    data: {
      from: utc(range.from),
      to: utc(range.to),
      income: income.map(nodeView),
      expense: expense.map(nodeView),
      totals: {
        income: amountOf(sumOf(income)),
        expense: amountOf(sumOf(expense)),
        surplus: amountOf(sumOf(income) - sumOf(expense)),
      },
      byNetAssetClass: {
        income: classView(byClass(balances, ["INCOME"])),
        expense: classView(byClass(balances, ["EXPENSE"])),
        surplus: classView(
          combine(
            byClass(balances, ["INCOME"]),
            byClass(balances, ["EXPENSE"]),
            -1,
          ),
        ),
      },
    },
  });
};

const onPerubahanAsetNeto = (url: URL) => {
  const range = readRange(url);
  if ("failure" in range) return range.failure;

  const opening = balancesFor(null, dayBefore(range.from));
  const inRange = balancesFor(range.from, range.to);

  const openingNet = combine(
    byClass(opening, ["EQUITY"]),
    combine(byClass(opening, ["INCOME"]), byClass(opening, ["EXPENSE"]), -1),
    1,
  );
  const income = byClass(inRange, ["INCOME"]);
  const expense = byClass(inRange, ["EXPENSE"]);
  const change = combine(income, expense, -1);
  const equityMovement = byClass(inRange, ["EQUITY"]);

  return json({
    status: 200,
    message: "Berhasil Mendapatkan Laporan Perubahan Aset Neto",
    data: {
      from: utc(range.from),
      to: utc(range.to),
      opening: classView(openingNet),
      income: classView(income),
      expense: classView(expense),
      change: classView(change),
      equityMovement: classView(equityMovement),
      closing: classView(
        combine(combine(openingNet, change, 1), equityMovement, 1),
      ),
      classes: ["TANPA_PEMBATASAN", "DENGAN_PEMBATASAN"],
    },
  });
};

/**
 * Arus kas metode langsung — cermin `arusKas` di server, termasuk penolakannya.
 *
 * Mock yang melaporkan nol di sini akan menyembunyikan satu-satunya laporan di
 * modul ini yang bisa menolak, dan layar penolakannya tidak akan pernah
 * terlihat sampai produksi.
 */
const onArusKas = (url: URL) => {
  const range = readRange(url);
  if ("failure" in range) return range.failure;

  const cashAccounts = liveAccounts().filter(
    (row) => row.cashFlowCategory === "KAS",
  );

  if (!cashAccounts.length) {
    return json(
      {
        status: 400,
        error:
          "Belum Ada Akun Yang Ditandai Kas. Tetapkan Kategori Arus Kas Pada Akun Kas Dan Bank Terlebih Dahulu",
      },
      400,
    );
  }

  const cashIds = new Set(cashAccounts.map((row) => row.id));
  const byId = new Map(liveAccounts().map((row) => [row.id, row]));

  const openingCash = balancesFor(null, dayBefore(range.from))
    .filter((row) => cashIds.has(row.id))
    .reduce((sum, row) => sum + row.cents, 0);

  const sections: Record<string, number> = {
    OPERASI: 0,
    INVESTASI: 0,
    PENDANAAN: 0,
  };
  const lines = new Map<
    number,
    { code: string; name: string; section: string; amount: number }
  >();
  let isDerived = false;

  const entries = JOURNAL_ENTRY.filter(
    (entry) =>
      entry.status === "POSTED" &&
      entry.entryDate >= range.from &&
      entry.entryDate <= range.to &&
      entry.lines.some((line) => cashIds.has(line.accountId)) &&
      !process.env.MOCK_EMPTY,
  );

  for (const entry of entries) {
    const cashDelta = entry.lines
      .filter((line) => cashIds.has(line.accountId))
      .reduce(
        (sum, line) => sum + centsOf(line.debit) - centsOf(line.credit),
        0,
      );

    if (cashDelta === 0) continue;

    const others = entry.lines
      .filter((line) => !cashIds.has(line.accountId))
      .map((line) => ({
        accountId: line.accountId,
        weight: Math.abs(centsOf(line.debit) - centsOf(line.credit)),
      }))
      .filter((line) => line.weight !== 0);

    const total = others.reduce((sum, line) => sum + line.weight, 0);
    let left = cashDelta;

    const shares =
      others.length === 0 || total === 0
        ? [{ accountId: -1, amount: cashDelta }]
        : others.map((line, index) => {
            const amount =
              index === others.length - 1
                ? left
                : Math.round((cashDelta * line.weight) / total);
            left -= amount;

            return { accountId: line.accountId, amount };
          });

    for (const share of shares) {
      const account = byId.get(share.accountId);
      const section = account ? cashFlowOf(account) : "OPERASI";
      if (section === "KAS") continue;

      if (account && account.cashFlowCategory === null) isDerived = true;

      sections[section] = (sections[section] ?? 0) + share.amount;

      if (!account) continue;

      const row = lines.get(account.id);
      lines.set(account.id, {
        code: account.code,
        name: account.name,
        section,
        amount: (row?.amount ?? 0) + share.amount,
      });
    }
  }

  const change =
    (sections.OPERASI ?? 0) +
    (sections.INVESTASI ?? 0) +
    (sections.PENDANAAN ?? 0);

  return json({
    status: 200,
    message: "Berhasil Mendapatkan Laporan Arus Kas",
    data: {
      from: utc(range.from),
      to: utc(range.to),
      openingCash: amountOf(openingCash),
      sections: {
        operasi: amountOf(sections.OPERASI ?? 0),
        investasi: amountOf(sections.INVESTASI ?? 0),
        pendanaan: amountOf(sections.PENDANAAN ?? 0),
      },
      lines: [...lines.values()]
        .filter((row) => row.amount !== 0)
        .sort(
          (a, b) =>
            a.section.localeCompare(b.section) || a.code.localeCompare(b.code),
        )
        .map((row) => ({ ...row, amount: amountOf(row.amount) })),
      change: amountOf(change),
      closingCash: amountOf(openingCash + change),
      cashAccounts: cashAccounts.map((row) => ({
        code: row.code,
        name: row.name,
      })),
      isDerived,
    },
  });
};

const ledgerPostings = (accountId: number, from: string, to: string) =>
  postings(from, to)
    .filter(({ line }) => line.accountId === accountId)
    .sort(
      (a, b) =>
        a.entry.entryDate.localeCompare(b.entry.entryDate) ||
        a.line.id - b.line.id,
    );

const movementOf = (type: AccountType, rows: readonly Posting[]) =>
  rows.reduce(
    (total, { line }) =>
      total + sideOf(type, centsOf(line.debit), centsOf(line.credit)),
    0,
  );

const onBukuBesar = (url: URL) => {
  const code = (url.searchParams.get("code") ?? "").trim();
  if (!code) return issue("code", "Mohon Lengkapi Kode Akun");

  const range = readRange(url);
  if ("failure" in range) return range.failure;

  const account = liveAccounts().find(
    (row) => row.code.toLowerCase() === code.toLowerCase(),
  );
  if (!account)
    return json({ status: 404, error: "Akun Tidak Ditemukan" }, 404);

  const before = postings(null, range.from).filter(
    ({ entry, line }) =>
      line.accountId === account.id && entry.entryDate < range.from,
  );
  const inRange = ledgerPostings(account.id, range.from, range.to);
  const openingBalance = movementOf(account.type, before);

  const { page, limit } = paging(url);
  let running = openingBalance;
  const rows = inRange.map(({ entry, line }) => {
    running += sideOf(account.type, centsOf(line.debit), centsOf(line.credit));

    return {
      entryCode: entry.code,
      entryPublicId: journalView(entry).publicId,
      entryDate: utc(entry.entryDate),
      description: line.description ?? entry.description,
      debit: line.debit,
      credit: line.credit,
      balance: amountOf(running),
    };
  });

  return json({
    status: 200,
    message: "Berhasil Mendapatkan Buku Besar",
    totalData: rows.length,
    totalPage: Math.ceil(rows.length / limit),
    data: {
      account: { code: account.code, name: account.name, type: account.type },
      from: utc(range.from),
      to: utc(range.to),
      openingBalance: amountOf(openingBalance),
      rows: rows.slice((page - 1) * limit, page * limit),
      closingBalance: amountOf(
        openingBalance + movementOf(account.type, inRange),
      ),
      totalData: rows.length,
      totalPage: Math.ceil(rows.length / limit),
    },
  });
};

export const laporanKeuanganMock: MockHandler = (ctx) => {
  const { path, method, url, can } = ctx;

  if (path !== "/laporan-keuangan" && !path.startsWith("/laporan-keuangan/")) {
    return null;
  }

  if (method !== "GET") return null;
  if (!can(MENU.LAPORAN_KEUANGAN, "VIEW")) return denied();
  if (process.env.MOCK_500) return serverError();

  if (path === "/laporan-keuangan/neraca") return onNeraca(url);
  if (path === "/laporan-keuangan/surplus-defisit")
    return onSurplusDefisit(url);
  if (path === "/laporan-keuangan/perubahan-aset-neto") {
    return onPerubahanAsetNeto(url);
  }
  if (path === "/laporan-keuangan/arus-kas") return onArusKas(url);
  if (path === "/laporan-keuangan/buku-besar") return onBukuBesar(url);

  return null;
};
