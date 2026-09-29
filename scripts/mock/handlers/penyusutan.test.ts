import { describe, expect, test } from "bun:test";

import { TODAY, periodLabel } from "../inventaris-store";
import type { MockAction } from "../kit";

import { penyusutanMock } from "./penyusutan";

type Json = {
  status: number;
  error?: string;
  message?: string;
  issues?: { path: string; message: string }[];
  data?: unknown;
};

type Run = {
  code: string;
  year: number;
  month: number;
  status: string;
  entryCount: number;
  updatedAt: string | null;
  journal?: { code: string } | null;
};

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
  const response = (await penyusutanMock({
    request,
    url,
    path: input.split("?")[0],
    method,
    can,
    isAdmin: true,
    sessionCode: "test",
  })) as Response;

  return { status: response.status, body: (await response.json()) as Json };
};

const periodAt = (offset: number) => {
  const index = Number(TODAY.slice(0, 4)) * 12 + Number(TODAY.slice(5, 7)) - 1;
  const target = index + offset;

  return { year: Math.floor(target / 12), month: (target % 12) + 1 };
};

const labelAt = (offset: number) => {
  const { year, month } = periodAt(offset);

  return periodLabel(year, month);
};

const listRuns = async (query = "") =>
  (await onCall("GET", `/penyusutan${query}`)).body.data as Run[];

const codeAt = async (offset: number) => {
  const { year, month } = periodAt(offset);
  const found = (await listRuns()).find(
    (run) => run.year === year && run.month === month,
  );

  return found?.code ?? "";
};

const withFlag = async <T>(flag: string, run: () => Promise<T>) => {
  process.env[flag] = "1";
  try {
    return await run();
  } finally {
    delete process.env[flag];
  }
};

describe("mock /penyusutan", () => {
  test("daftar urut periode terbaru; filter status", async () => {
    const runs = await listRuns();
    expect(runs.map((run) => run.status)).toEqual([
      "DRAFT",
      "POSTED",
      "POSTED",
    ]);
    expect(runs[0].updatedAt).not.toBeNull();

    const posted = await listRuns("?status=POSTED");
    expect(posted).toHaveLength(2);

    const none = await onCall("GET", "/penyusutan?year=1999");
    expect(none.status).toBe(404);
    expect(none.body.error).toBe("Penyusutan Tidak Ditemukan");
  });

  test("buka periode: zod, sudah ada, masa depan, masih ada draf", async () => {
    const invalid = await onCall("POST", "/penyusutan", { month: 13 });
    expect(invalid.status).toBe(400);
    expect(invalid.body.issues?.map((issue) => issue.path)).toEqual([
      "year",
      "month",
    ]);

    expect((await onCall("POST", "/penyusutan", periodAt(-1))).status).toBe(
      409,
    );

    const future = await onCall("POST", "/penyusutan", periodAt(1));
    expect(future.body.error).toBe("Periode Penyusutan Belum Dimulai");

    const blocked = await onCall("POST", "/penyusutan", periodAt(0));
    expect(blocked.status).toBe(400);
    expect(blocked.body.issues).toEqual([
      {
        path: "month",
        message: `Posting Penyusutan ${labelAt(-1)} Terlebih Dahulu`,
      },
    ]);
  });

  test("posting draf: akun, periode fiskal, lalu sukses dengan jurnal", async () => {
    const code = await codeAt(-1);

    const noSetting = await withFlag("MOCK_PENYUSUTAN_NO_SETTING", () =>
      onCall("PUT", `/penyusutan/${code}/posting`),
    );
    expect(noSetting.body.error).toBe(
      "Akun Beban Penyusutan Belum Diatur Di Setelan Akuntansi",
    );

    const closed = await withFlag("MOCK_PENYUSUTAN_PERIOD_CLOSED", () =>
      onCall("PUT", `/penyusutan/${code}/posting`),
    );
    expect(closed.status).toBe(400);

    const posted = await onCall(
      "PUT",
      `/penyusutan/${code.toLowerCase()}/posting`,
    );
    expect(posted.status).toBe(200);
    expect((posted.body.data as Run).journal?.code).toMatch(/^JRN-/);

    const again = await onCall("PUT", `/penyusutan/${code}/hitung`);
    expect(again.body.error).toBe(
      "Penyusutan Ini Sudah Diposting Atau Dibalik",
    );
    expect((await onCall("DELETE", `/penyusutan/${code}`)).status).toBe(400);
  });

  test("bulan lampau yang terlewat: penyusutan berikutnya", async () => {
    const past = await onCall("POST", "/penyusutan", periodAt(-6));

    expect(past.body.issues?.[0]).toEqual({
      path: "month",
      message: `Penyusutan Berikutnya Adalah ${labelAt(0)}`,
    });
  });

  test("buka bulan berjalan → posting ditolak sebelum hitung → hitung → hapus", async () => {
    const opened = await onCall("POST", "/penyusutan", periodAt(0));
    expect(opened.status).toBe(201);
    const { code } = opened.body.data as Run;

    const early = await onCall("PUT", `/penyusutan/${code}/posting`);
    expect(early.body.error).toBe(
      "Penyusutan Ini Belum Dihitung. Hitung Terlebih Dahulu",
    );

    const calculated = await onCall("PUT", `/penyusutan/${code}/hitung`);
    expect(calculated.status).toBe(200);
    expect((calculated.body.data as Run).updatedAt).not.toBeNull();
    expect((calculated.body.data as Run).journal).toBeNull();

    const removed = await onCall("DELETE", `/penyusutan/${code}`);
    expect(removed.body.message).toBe("Berhasil Menghapus Penyusutan");
    expect((await onCall("GET", `/penyusutan/${code}`)).status).toBe(404);
  });

  test("guard per aksi", async () => {
    const viewOnly = (_slug: string, action: MockAction) => action === "VIEW";

    expect(
      (await onCall("GET", "/penyusutan", undefined, viewOnly)).status,
    ).toBe(200);
    expect(
      (await onCall("POST", "/penyusutan", periodAt(0), viewOnly)).status,
    ).toBe(403);
    expect(
      (await onCall("PUT", "/penyusutan/PNY-X/hitung", undefined, viewOnly))
        .status,
    ).toBe(403);
    expect(
      await penyusutanMock({ path: "/penyusutan-lain" } as never),
    ).toBeNull();
  });
});
