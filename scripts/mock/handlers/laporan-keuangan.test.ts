import { afterEach, describe, expect, test } from "bun:test";

import { MENU } from "../../../src/config/menu";
import { ACCOUNT, JOURNAL_ENTRY } from "../keuangan-store";
import type { MockAction, MockContext } from "../kit";

import { laporanKeuanganMock } from "./laporan-keuangan";

afterEach(() => {
  delete process.env.MOCK_500;
  delete process.env.MOCK_EMPTY;
  delete process.env.MOCK_NO_OPENING;
  delete process.env.MOCK_UNBALANCED;
});

const call = async (path: string, granted: MockAction[] = ["VIEW"]) => {
  const url = new URL(`http://mock.test/api/v1${path}`);
  const context: MockContext = {
    request: new Request(url),
    url,
    path: url.pathname.replace("/api/v1", ""),
    method: "GET",
    can: (slug, action) =>
      slug === MENU.FINANCIAL_STATEMENT && granted.includes(action),
    isAdmin: false,
    sessionCode: "test",
  };
  const response = await laporanKeuanganMock(context);
  if (!response) throw new Error("handler tidak menjawab");

  return { status: response.status, body: (await response.json()) as unknown };
};

const dataOf = async <T>(path: string) =>
  ((await call(path)).body as { data: T }).data;

const DATES = JOURNAL_ENTRY.map((entry) => entry.entryDate).sort();

const START = DATES[0]!;

const END = DATES[DATES.length - 1]!;

const RANGE = `from=${START}&to=${END}`;

const NERACA = `/laporan-keuangan/neraca?date=${END}`;

type Node = { code: string; total: string; children: Node[] };

type Neraca = {
  assets: Node[];
  liabilities: Node[];
  equity: Node[];
  totals: {
    assets: string;
    liabilities: string;
    equity: string;
    surplus: string;
  };
  balanced: boolean;
  isOpeningEntered: boolean;
};

type Ledger = {
  openingBalance: string;
  closingBalance: string;
  rows: {
    entryCode: string;
    entryPublicId: string;
    balance: string;
  }[];
  totalData: number;
};

const issuePathOf = (body: unknown) =>
  (body as { issues: { path: string }[] }).issues[0]!.path;

const flatten = (nodes: readonly Node[]): Node[] =>
  nodes.flatMap((node) => [node, ...flatten(node.children)]);

const totalOf = (nodes: readonly Node[]) =>
  nodes.reduce((sum, node) => sum + Number(node.total), 0);

describe("guard dan galat", () => {
  test("tanpa VIEW ditolak", async () => {
    expect((await call(NERACA, [])).status).toBe(403);
  });

  test("MOCK_500 menjawab 500", async () => {
    process.env.MOCK_500 = "1";

    expect((await call(NERACA)).status).toBe(500);
  });

  test("tanggal tidak valid ditolak 400 dengan issues", async () => {
    const { status, body } = await call("/laporan-keuangan/neraca?date=abc");

    expect(status).toBe(400);
    expect(issuePathOf(body)).toBe("date");
  });

  test("rentang terbalik ditolak pada path to", async () => {
    const { status, body } = await call(
      `/laporan-keuangan/surplus-defisit?from=${END}&to=${START}`,
    );

    expect(status).toBe(400);
    expect(issuePathOf(body)).toBe("to");
  });

  test("buku besar tanpa kode akun ditolak", async () => {
    const { status, body } = await call(
      `/laporan-keuangan/buku-besar?${RANGE}`,
    );

    expect(status).toBe(400);
    expect(issuePathOf(body)).toBe("code");
  });

  test("buku besar akun yang tidak ada tetap 404", async () => {
    expect(
      (await call(`/laporan-keuangan/buku-besar?code=9-999&${RANGE}`)).status,
    ).toBe(404);
  });
});

describe("kosong dijawab nol, bukan 404", () => {
  test("ketiga laporan tetap 200 saat MOCK_EMPTY", async () => {
    process.env.MOCK_EMPTY = "1";

    const code = ACCOUNT[1]!.code;

    expect((await call(NERACA)).status).toBe(200);
    expect(
      (await call(`/laporan-keuangan/surplus-defisit?${RANGE}`)).status,
    ).toBe(200);
    expect(
      (await call(`/laporan-keuangan/buku-besar?code=${code}&${RANGE}`)).status,
    ).toBe(200);
  });

  test("neraca kosong bernilai nol, tetap seimbang, tetap berisi akun", async () => {
    process.env.MOCK_EMPTY = "1";

    const neraca = await dataOf<Neraca>(NERACA);

    expect(neraca.totals).toEqual({
      assets: "0",
      liabilities: "0",
      equity: "0",
      surplus: "0",
    });
    expect(neraca.balanced).toBe(true);
    expect(neraca.assets.length).toBeGreaterThan(0);
  });
});

describe("neraca", () => {
  test("akun bersaldo nol tetap dikembalikan", async () => {
    const neraca = await dataOf<Neraca>(NERACA);
    const idle = flatten(neraca.assets).find((node) => node.code === "1-110");

    expect(idle?.total).toBe("0");
  });

  test("induk menjumlah anaknya", async () => {
    const neraca = await dataOf<Neraca>(NERACA);
    const root = neraca.assets[0]!;

    expect(root.children.length).toBeGreaterThan(0);
    expect(Number(root.total)).toBe(totalOf(root.children));
  });

  test("aset sama dengan kewajiban + ekuitas + surplus", async () => {
    const neraca = await dataOf<Neraca>(NERACA);

    expect(Number(neraca.totals.assets)).toBe(
      Number(neraca.totals.liabilities) +
        Number(neraca.totals.equity) +
        Number(neraca.totals.surplus),
    );
    expect(neraca.balanced).toBe(true);
  });

  test("MOCK_UNBALANCED menjawab balanced: false", async () => {
    process.env.MOCK_UNBALANCED = "1";

    expect((await dataOf<Neraca>(NERACA)).balanced).toBe(false);
  });

  test("saldo awal terbaca dari entri MANUAL yang diposting", async () => {
    expect((await dataOf<Neraca>(NERACA)).isOpeningEntered).toBe(true);
  });

  test("MOCK_NO_OPENING menandai saldo awal belum dimasukkan", async () => {
    process.env.MOCK_NO_OPENING = "1";

    expect((await dataOf<Neraca>(NERACA)).isOpeningEntered).toBe(false);
  });

  test("tanggal sebelum entri MANUAL pertama belum punya saldo awal", async () => {
    const neraca = await dataOf<Neraca>(
      `/laporan-keuangan/neraca?date=${Number(START.slice(0, 4)) - 1}-12-31`,
    );

    expect(neraca.isOpeningEntered).toBe(false);
    expect(neraca.totals.assets).toBe("0");
  });
});

describe("buku besar", () => {
  const kas = ACCOUNT.find((row) => row.code === "1-100")!;

  const ledger = (query: string) =>
    dataOf<Ledger>(
      `/laporan-keuangan/buku-besar?code=${kas.code}&${RANGE}&${query}`,
    );

  test("saldo awal dan akhir dihitung atas rentang, bukan atas halaman", async () => {
    const all = await ledger("limit=100");
    const second = await ledger("limit=1&page=2");

    expect(all.rows.length).toBeGreaterThan(1);
    expect(second.openingBalance).toBe(all.openingBalance);
    expect(second.closingBalance).toBe(all.closingBalance);
    expect(second.totalData).toBe(all.totalData);
    expect(second.rows[0]!.balance).toBe(all.rows[1]!.balance);
  });

  test("saldo akhir sama dengan saldo baris terakhir", async () => {
    const all = await ledger("limit=100");

    expect(all.closingBalance).toBe(all.rows[all.rows.length - 1]!.balance);
  });

  test("setiap baris membawa publicId entri, bukan hanya kodenya", async () => {
    const all = await ledger("limit=100");

    for (const row of all.rows) {
      const entry = JOURNAL_ENTRY.find((item) => item.code === row.entryCode)!;

      expect(row.entryPublicId).toBe(entry.publicId);
    }
  });

  test("hanya entri POSTED yang terbaca", async () => {
    const draft = JOURNAL_ENTRY.find((entry) => entry.status === "DRAFT")!;
    const all = await ledger("limit=100");

    expect(all.rows.map((row) => row.entryCode)).not.toContain(draft.code);
  });
});
