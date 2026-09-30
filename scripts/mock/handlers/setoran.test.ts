import { afterEach, describe, expect, test } from "bun:test";

import { MENU } from "../../../src/config/menu";
import {
  ACCOUNT,
  JOURNAL_ENTRY,
  TODAY,
  journalOfSource,
} from "../keuangan-store";
import type { MockAction } from "../kit";

import { CASH_TRANSFER, setoranMock } from "./setoran";

type Json = {
  status: number;
  error?: string;
  code?: string;
  message?: string;
  issues?: { path: string; message: string }[];
  data?: unknown;
};

const SEED = CASH_TRANSFER.map((row) => ({ ...row }));
const ACCOUNT_SEED = ACCOUNT.map((row) => ({ ...row }));
const JOURNAL_COUNT = JOURNAL_ENTRY.length;

afterEach(() => {
  CASH_TRANSFER.splice(
    0,
    CASH_TRANSFER.length,
    ...SEED.map((row) => ({ ...row })),
  );
  ACCOUNT.splice(0, ACCOUNT.length, ...ACCOUNT_SEED.map((row) => ({ ...row })));
  JOURNAL_ENTRY.splice(JOURNAL_COUNT, JOURNAL_ENTRY.length);
  delete process.env.MOCK_PERIOD_CLOSED;
});

const onCall = async (
  method: string,
  input: string,
  body?: unknown,
  can: (slug: string, action: MockAction) => boolean = () => true,
) => {
  const url = new URL(`/api/v1${input}`, "http://mock.test");
  const request = new Request(url, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const response = await setoranMock({
    request,
    url,
    path: input.split("?")[0],
    method,
    can,
    isAdmin: true,
    sessionCode: "test",
  });

  if (!response) return null;

  return { status: response.status, body: (await response.json()) as Json };
};

const VALID = {
  transferDate: TODAY,
  fromAccountId: 2,
  toAccountId: 4,
  amount: "500000",
  description: "Setoran kolekte",
  reference: "SLIP-1",
  bapelId: null,
};

const draftCode = () =>
  CASH_TRANSFER.find((row) => row.status === "DRAFT")?.code ?? "";

const paidCode = () =>
  CASH_TRANSFER.find((row) => row.status === "PAID")?.code ?? "";

const viewOf = (body: Json | undefined) =>
  body?.data as Record<string, unknown> | undefined;

const rowsOf = <T>(body: Json | undefined) => (body?.data ?? []) as T[];

const issuePathOf = (body: Json | undefined) =>
  body?.issues?.map((issue) => issue.path);

describe("mock /setoran daftar", () => {
  test("terbaru dulu, disaring status, rentang tanggal, dan referensi", async () => {
    const all = await onCall("GET", "/setoran?limit=100");
    const dates = rowsOf<{ transferDate: string }>(all?.body).map(
      (row) => row.transferDate,
    );

    expect([...dates]).toEqual([...dates].sort().reverse());

    const paid = await onCall("GET", "/setoran?status=PAID&limit=100");
    expect(rowsOf<{ status: string }>(paid?.body)[0].status).toBe("PAID");

    const byReference = await onCall("GET", "/setoran?filter=slip-0098");
    expect(byReference?.body.data).toHaveLength(1);
  });

  test("tanpa VIEW ditolak 403", async () => {
    const denied = await onCall("GET", "/setoran", undefined, () => false);

    expect(denied?.status).toBe(403);
  });
});

describe("mock /setoran catat", () => {
  test("urutan galat: zod, akun sama, tidak ada, nonaktif, bukan Aset", async () => {
    const empty = await onCall("POST", "/setoran", {});
    expect(issuePathOf(empty?.body)).toEqual([
      "transferDate",
      "fromAccountId",
      "toAccountId",
      "amount",
      "description",
    ]);

    const same = await onCall("POST", "/setoran", {
      ...VALID,
      toAccountId: 2,
    });
    expect(same?.status).toBe(400);
    expect(issuePathOf(same?.body)).toEqual(["toAccountId"]);
    expect(same?.body.error).toBe("Akun Tujuan Harus Berbeda Dari Akun Asal");

    const missing = await onCall("POST", "/setoran", {
      ...VALID,
      toAccountId: 999,
    });
    expect(missing?.status).toBe(404);
    expect(issuePathOf(missing?.body)).toEqual(["toAccountId"]);

    const inactive = await onCall("POST", "/setoran", {
      ...VALID,
      toAccountId: 25,
    });
    expect(inactive?.status).toBe(400);
    expect(inactive?.body.code).toBe("ACCOUNT_INACTIVE");

    const wrongType = await onCall("POST", "/setoran", {
      ...VALID,
      toAccountId: 16,
    });
    expect(issuePathOf(wrongType?.body)).toEqual(["toAccountId"]);
    expect(wrongType?.body.error).toBe("Akun Harus Bertipe Aset");
  });

  test("tersimpan sebagai draf tanpa jurnal", async () => {
    const created = await onCall("POST", "/setoran", VALID);

    expect(created?.status).toBe(201);
    expect(viewOf(created?.body)?.status).toBe("DRAFT");
    expect(viewOf(created?.body)?.journal).toBeNull();
    expect(viewOf(created?.body)?.bapel).toBeNull();
    expect(JOURNAL_ENTRY).toHaveLength(JOURNAL_COUNT);
  });

  test("tanpa CREATE ditolak 403", async () => {
    const denied = await onCall("POST", "/setoran", VALID, () => false);

    expect(denied?.status).toBe(403);
  });
});

describe("mock /setoran setor", () => {
  test("menulis entri D akun tujuan / K akun asal, sumber CASH_TRANSFER", async () => {
    const row = CASH_TRANSFER.find((item) => item.status === "DRAFT");
    const posted = await onCall("PUT", `/setoran/${row?.code}/setor`);
    const entry = journalOfSource("CASH_TRANSFER", row?.id ?? 0);

    expect(posted?.status).toBe(200);
    expect(viewOf(posted?.body)?.status).toBe("PAID");
    expect(entry?.lines).toEqual([
      expect.objectContaining({ accountId: 4, debit: "6420000", credit: "0" }),
      expect.objectContaining({ accountId: 2, debit: "0", credit: "6420000" }),
    ]);
  });

  test("entri yang diklaim dokumen benar bisa dibuka dari Jurnal", async () => {
    const row = CASH_TRANSFER.find((item) => item.status === "DRAFT");
    const posted = await onCall("PUT", `/setoran/${row?.code}/setor`);
    const claimed = (viewOf(posted?.body)?.journal as { code: string }).code;
    const codes = JOURNAL_ENTRY.map((entry) => entry.code);

    expect(codes).toContain(claimed);
    expect(new Set(codes).size).toBe(codes.length);
  });

  test("setor dua kali ditolak", async () => {
    const code = draftCode();
    await onCall("PUT", `/setoran/${code}/setor`);
    const again = await onCall("PUT", `/setoran/${code}/setor`);

    expect(again?.status).toBe(400);
    expect(again?.body.error).toBe("Setoran Ini Sudah Disetor");
  });

  test("periode tertutup ditolak dengan code, menyebut bulannya", async () => {
    process.env.MOCK_PERIOD_CLOSED = "1";
    const closed = await onCall("PUT", `/setoran/${draftCode()}/setor`);

    expect(closed?.status).toBe(400);
    expect(closed?.body.code).toBe("PERIOD_CLOSED");
    expect(closed?.body.error).toMatch(/Periode Fiskal .+ Sudah Ditutup/);
  });

  test("setor dijaga CREATE, bukan UPDATE", async () => {
    const code = draftCode();
    const denied = await onCall(
      "PUT",
      `/setoran/${code}/setor`,
      undefined,
      (_slug, action) => action !== "CREATE",
    );

    expect(denied?.status).toBe(403);
  });
});

describe("mock /setoran batal", () => {
  test("alasan wajib, lalu pembalikan bertanggal hari ini", async () => {
    const code = paidCode();
    const blank = await onCall("PUT", `/setoran/${code}/batal`, {
      reason: " ",
    });

    expect(issuePathOf(blank?.body)).toEqual(["reason"]);

    const cancelled = await onCall("PUT", `/setoran/${code}/batal`, {
      reason: "Salah catat",
    });
    const reversal = JOURNAL_ENTRY.at(-1);

    expect(viewOf(cancelled?.body)?.status).toBe("CANCELLED");
    expect(reversal?.entryDate).toBe(TODAY);
    expect(reversal?.sourceType).toBe("MANUAL");
    expect(reversal?.sourceId).toBeNull();
    expect(reversal?.reversalOfId).not.toBeNull();
  });

  test("draf tidak perlu dibatalkan", async () => {
    const refused = await onCall("PUT", `/setoran/${draftCode()}/batal`, {
      reason: "Salah",
    });

    expect(refused?.status).toBe(400);
    expect(refused?.body.error).toBe(
      "Setoran Yang Masih Draft Tidak Perlu Dibatalkan",
    );
  });

  test("batal dijaga DELETE", async () => {
    const denied = await onCall(
      "PUT",
      `/setoran/${paidCode()}/batal`,
      { reason: "Salah" },
      (_slug, action) => action !== "DELETE",
    );

    expect(denied?.status).toBe(403);
  });
});

describe("mock /setoran rute", () => {
  test("PUT biasa bukan milik handler ini: tanpa ubah, tanpa hapus", async () => {
    expect(await onCall("PUT", `/setoran/${draftCode()}`, VALID)).toBeNull();
    expect(await onCall("DELETE", `/setoran/${draftCode()}`)).toBeNull();
  });

  test("guard memakai MENU.SETORAN", async () => {
    const slugs: string[] = [];
    await onCall("GET", "/setoran", undefined, (slug) => {
      slugs.push(slug);
      return true;
    });

    expect(slugs).toEqual([MENU.SETORAN]);
  });
});
