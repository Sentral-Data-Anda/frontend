import { describe, expect, test } from "bun:test";

import { FISCAL_PERIOD } from "../keuangan-store";

import { periodeFiskalMock } from "./periode-fiskal";

type Json = {
  status: number;
  error?: string;
  issues?: { path: string; message: string }[];
  data?: Record<string, unknown>;
};

const onCall = async (method: string, input: string, body?: unknown) => {
  const url = new URL(`/api/v1${input}`, "http://mock.test");
  const response = await periodeFiskalMock({
    request: new Request(url, {
      method,
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
    url,
    path: input.split("?")[0] ?? "",
    method,
    can: () => true,
    isAdmin: true,
    sessionCode: "test",
  });

  if (!response) return null;

  return { status: response.status, body: (await response.json()) as Json };
};

const openMonths = () =>
  FISCAL_PERIOD.filter((row) => row.status === "OPEN").sort(
    (a, b) => a.year - b.year || a.month - b.month,
  );

describe("buka tahun", () => {
  test("membuat 12 baris dengan Februari kabisat benar", async () => {
    const created = await onCall("POST", "/periode-fiskal", { year: 2024 });
    const rows = FISCAL_PERIOD.filter((row) => row.year === 2024);

    expect(created?.status).toBe(201);
    expect(rows.length).toBe(12);

    const february = await onCall("GET", "/periode-fiskal?year=2024&limit=12");
    const data = february?.body.data as unknown as { endDate: string }[];

    expect(data[1].endDate).toBe("2024-02-29T00:00:00.000Z");
  });

  test("tahun yang sudah ada ditolak 409 di field year", async () => {
    const again = await onCall("POST", "/periode-fiskal", { year: 2024 });

    expect(again?.status).toBe(409);
    expect(again?.body.issues).toEqual([
      { path: "year", message: "Periode Fiskal Tahun 2024 Sudah Dibuka" },
    ]);
  });
});

describe("tutup dan buka kembali", () => {
  test("tutup tidak berurutan ditolak dengan bulan yang harus lebih dulu", async () => {
    const last = openMonths().at(-1);
    const refused = await onCall("PUT", `/periode-fiskal/${last?.id}/tutup`);

    expect(refused?.status).toBe(400);
    expect(refused?.body.error).toMatch(/^Tutup .+ Terlebih Dahulu$/);
  });

  test("buka kembali menolak tanpa alasan lalu menyimpan alasannya", async () => {
    const first = openMonths()[0];
    await onCall("PUT", `/periode-fiskal/${first.id}/tutup`);

    const empty = await onCall("PUT", `/periode-fiskal/${first.id}/buka`, {
      reopenReason: "  ",
    });

    expect(empty?.status).toBe(400);
    expect(empty?.body.issues?.[0].path).toBe("reopenReason");

    const done = await onCall("PUT", `/periode-fiskal/${first.id}/buka`, {
      reopenReason: "Koreksi kolekte",
    });

    expect(done?.status).toBe(200);
    expect(done?.body.data?.reopenReason).toBe("Koreksi kolekte");
    expect(done?.body.data?.status).toBe("OPEN");
  });
});
