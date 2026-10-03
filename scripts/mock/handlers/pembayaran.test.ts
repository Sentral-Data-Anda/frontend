import { afterEach, describe, expect, test } from "bun:test";

import { MENU, type MenuSlug } from "../../../src/config/menu";
import { ACCOUNTING_SETTING, JOURNAL_ENTRY } from "../keuangan-store";
import type { MockAction } from "../kit";

import { PAYMENT, pembayaranMock } from "./pembayaran";

type Grant = (slug: MenuSlug, action: MockAction) => boolean;

const ALL: Grant = () => true;

const TREASURY_ONLY: Grant = (slug) =>
  slug === MENU.PEMBAYARAN || slug === MENU.PERSEMBAHAN;

const GIVER_ONLY: Grant = (slug) => slug === MENU.PEMBAYARAN;

const call = (
  target: string,
  options: {
    method?: string;
    body?: unknown;
    can?: Grant;
    isAdmin?: boolean;
  } = {},
) => {
  const url = new URL(`/api/v1${target}`, "http://mock.test");
  const path = target.split("?")[0];
  const { method = "GET", body, can = ALL, isAdmin = false } = options;

  return pembayaranMock({
    request: new Request(url, {
      method,
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    }),
    url,
    path,
    method,
    can,
    isAdmin,
    sessionCode: "U-0001",
  });
};

const bodyOf = async (response: Response | null) =>
  (await response!.json()) as Record<string, unknown>;

const setSetting = (key: string, accountId: number | null) => {
  const row = ACCOUNTING_SETTING.find((item) => item.key === key)!;

  row.accountId = accountId;
};

const GATEWAY_ACCOUNT = 6;

const INCOME_ACCOUNT = 20;

const eventRow = () =>
  PAYMENT.find(
    (row) => row.purpose === "EVENT_REGISTRATION" && row.status === "PAID",
  )!;

afterEach(() => {
  setSetting("KAS_GATEWAY", null);
  setSetting("PENDAPATAN_EVENT", null);
  delete process.env.MOCK_EMPTY;
  delete process.env.MOCK_500;
});

describe("daftar dan halaman", () => {
  test("daftar terbaca, terbaru dulu", async () => {
    const body = await bodyOf(await call("/pembayaran?limit=100"));

    expect(body.status).toBe(200);
    expect((body.data as unknown[]).length).toBe(PAYMENT.length);
  });

  test("MOCK_EMPTY menjawab 404, konvensi daftar kosong", async () => {
    process.env.MOCK_EMPTY = "1";

    expect((await call("/pembayaran"))!.status).toBe(404);
  });

  test("MOCK_500 menjawab 500", async () => {
    process.env.MOCK_500 = "1";

    expect((await call("/pembayaran"))!.status).toBe(500);
  });

  test("tanpa VIEW ditolak", async () => {
    expect((await call("/pembayaran", { can: () => false }))!.status).toBe(403);
  });

  test("saringan status dan tujuan dipakai", async () => {
    const body = await bodyOf(
      await call(
        "/pembayaran?status=PAID&purpose=EVENT_REGISTRATION&limit=100",
      ),
    );
    const rows = body.data as { status: string; purpose: string }[];

    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row.status).toBe("PAID");
      expect(row.purpose).toBe("EVENT_REGISTRATION");
    }
  });

  test("bukan bendahara hanya melihat pembayarannya sendiri", async () => {
    const mine = await bodyOf(
      await call("/pembayaran?limit=100", { can: GIVER_ONLY }),
    );
    const all = await bodyOf(
      await call("/pembayaran?limit=100", { can: TREASURY_ONLY }),
    );

    expect((mine.data as unknown[]).length).toBeLessThan(
      (all.data as unknown[]).length,
    );
    for (const row of mine.data as { jemaat: { code: string } | null }[]) {
      expect(row.jemaat?.code).toBe("JMT-0012");
    }
  });
});

describe("satu kunci per sumber daya", () => {
  test("publicId ketemu", async () => {
    const response = await call(`/pembayaran/${PAYMENT[0].publicId}`);

    expect(response!.status).toBe(200);
  });

  test("kode ditolak, bukan diterima diam-diam", async () => {
    expect((await call(`/pembayaran/${PAYMENT[0].code}`))!.status).toBe(404);
  });
});

describe("hanya baca", () => {
  test("POST, PUT, dan DELETE tidak ada untuk staf", async () => {
    for (const method of ["POST", "PUT", "DELETE"]) {
      expect((await call("/pembayaran", { method }))!.status).toBe(404);
      expect(
        (await call(`/pembayaran/${PAYMENT[0].publicId}`, { method }))!.status,
      ).toBe(404);
    }
  });
});

describe("posting pembayaran event", () => {
  const range = () => {
    const paidAt = eventRow().paidAt!.slice(0, 10);

    return { from: `${paidAt.slice(0, 7)}-01`, to: paidAt };
  };

  test("digerbangi JURNAL CREATE, bukan PEMBAYARAN", async () => {
    const response = await call("/jurnal/posting-pembayaran?dryRun=1", {
      method: "POST",
      body: range(),
      can: (slug) => slug === MENU.PEMBAYARAN,
    });

    expect(response!.status).toBe(403);
  });

  test("setelan kosong menolak barisnya dengan kode, bukan prosa", async () => {
    const body = await bodyOf(
      await call("/jurnal/posting-pembayaran?dryRun=1", {
        method: "POST",
        body: range(),
      }),
    );
    const result = body.data as {
      posted: number;
      refused: { reasonCode: string }[];
    };

    expect(result.posted).toBe(0);
    expect(result.refused.length).toBeGreaterThan(0);
    expect(result.refused[0].reasonCode).toBe("SETTING_EMPTY");
  });

  test("pratinjau tidak menulis apa pun ke jurnal", async () => {
    setSetting("KAS_GATEWAY", GATEWAY_ACCOUNT);
    setSetting("PENDAPATAN_EVENT", INCOME_ACCOUNT);

    const before = JOURNAL_ENTRY.length;
    const body = await bodyOf(
      await call("/jurnal/posting-pembayaran?dryRun=1", {
        method: "POST",
        body: range(),
      }),
    );

    expect((body.data as { posted: number }).posted).toBeGreaterThan(0);
    expect(JOURNAL_ENTRY.length).toBe(before);
  });

  test("posting sungguhan menulis entri yang benar-benar ada, lalu dilewati", async () => {
    setSetting("KAS_GATEWAY", GATEWAY_ACCOUNT);
    setSetting("PENDAPATAN_EVENT", INCOME_ACCOUNT);

    const first = await bodyOf(
      await call("/jurnal/posting-pembayaran", {
        method: "POST",
        body: range(),
      }),
    );
    const posted = (first.data as { posted: number }).posted;

    expect(posted).toBeGreaterThan(0);

    const detail = await bodyOf(
      await call(`/pembayaran/${eventRow().publicId}`),
    );
    const journal = (detail.data as { journal: { publicId: string } | null })
      .journal;

    expect(journal).not.toBeNull();
    expect(
      JOURNAL_ENTRY.some((entry) => entry.publicId === journal!.publicId),
    ).toBe(true);

    const again = await bodyOf(
      await call("/jurnal/posting-pembayaran", {
        method: "POST",
        body: range(),
      }),
    );

    expect((again.data as { posted: number }).posted).toBe(0);
    expect((again.data as { skipped: number }).skipped).toBe(posted);
  });

  test("dryRun yang tidak dikenali ditolak, bukan dianggap posting sungguhan", async () => {
    const response = await call("/jurnal/posting-pembayaran?dryRun=mungkin", {
      method: "POST",
      body: range(),
    });

    expect(response!.status).toBe(400);
  });

  test("rentang terbalik dan rentang kelewat panjang ditolak", async () => {
    const reversed = await call("/jurnal/posting-pembayaran?dryRun=1", {
      method: "POST",
      body: { from: "2026-09-30", to: "2026-09-01" },
    });
    const tooWide = await call("/jurnal/posting-pembayaran?dryRun=1", {
      method: "POST",
      body: { from: "2026-01-01", to: "2026-03-01" },
    });

    expect(reversed!.status).toBe(400);
    expect(tooWide!.status).toBe(400);
  });
});
