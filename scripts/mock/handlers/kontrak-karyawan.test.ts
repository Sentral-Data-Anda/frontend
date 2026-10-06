import { afterEach, describe, expect, test } from "bun:test";

import { MENU } from "../../../src/config/menu";
import type { MockAction } from "../kit";

import {
  KARYAWAN_CONTRACT,
  kontrakKaryawanMock,
  resetKontrakKaryawan,
} from "./kontrak-karyawan";

type Json = {
  status: number;
  code?: string;
  error?: string;
  message?: string;
  issues?: { path: string; message: string }[];
  totalData?: number;
  data?: unknown;
};

afterEach(() => {
  resetKontrakKaryawan();
  delete process.env.MOCK_EMPTY;
  delete process.env.MOCK_500;
  delete process.env.MOCK_KTR_STEPUP;
  delete process.env.MOCK_KTR_SAVE_ERROR;
  delete process.env.MOCK_KTR_DELETE_ERROR;
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
  const response = await kontrakKaryawanMock({
    request,
    url,
    path: input.split("?")[0],
    method,
    can: can as never,
    isAdmin: true,
    sessionCode: "test",
  });

  if (!response) return null;

  return { status: response.status, body: (await response.json()) as Json };
};

const only =
  (slug: string) =>
  (candidate: string): boolean =>
    candidate === slug;

// Benihnya memberi tiap karyawan satu kontrak terbuka, jadi periode bebas
// satu-satunya ada SEBELUM benih itu mulai.
const BODY = {
  karyawanId: 2,
  contractType: "KONTRAK",
  position: "Admin Kantor",
  basicSalary: 4200000,
  effectiveFrom: "2000-01-01",
  effectiveTo: "2000-12-31",
  weeklyDayOff: [1],
  note: null,
};

const otherBody = (extra: Record<string, unknown> = {}) => ({
  ...BODY,
  karyawanId: 3,
  effectiveFrom: "2001-01-01",
  effectiveTo: "2001-12-31",
  ...extra,
});

const codesOf = (body: Json | undefined) =>
  (body?.data as { code: string }[]).map((row) => row.code);

const issuePathOf = (body: Json | undefined) => body?.issues?.[0]?.path;

describe("bentuk daftar", () => {
  test("urut mulai terbaru lebih dulu", async () => {
    const result = await onCall("GET", "/kontrak-karyawan?limit=100");

    expect(result?.status).toBe(200);
    expect(codesOf(result?.body)[0]).toBe("KTR-0006");
  });

  test("kosong menjawab 404, konvensi be-sada", async () => {
    process.env.MOCK_EMPTY = "1";

    expect((await onCall("GET", "/kontrak-karyawan"))?.status).toBe(404);
  });

  test("filter menyapu kode, jabatan, dan nama karyawan", async () => {
    const byName = await onCall("GET", "/kontrak-karyawan?filter=budi");
    const byPosition = await onCall("GET", "/kontrak-karyawan?filter=koster");
    const byCode = await onCall("GET", "/kontrak-karyawan?filter=ktr-0003");

    expect(codesOf(byName?.body)).toEqual(["KTR-0002"]);
    expect(codesOf(byPosition?.body)).toEqual(["KTR-0002"]);
    expect(codesOf(byCode?.body)).toEqual(["KTR-0003"]);
  });

  test("karyawanId menyaring ke orangnya", async () => {
    const result = await onCall("GET", "/kontrak-karyawan?karyawanId=1");

    expect(codesOf(result?.body).sort()).toEqual(["KTR-0001", "KTR-0005"]);
  });
});

describe("kunci path", () => {
  test("kode ketemu, tanpa peduli huruf besar-kecil", async () => {
    expect((await onCall("GET", "/kontrak-karyawan/ktr-0001"))?.status).toBe(
      200,
    );
  });

  test("publicId dan id bukan kunci", async () => {
    expect((await onCall("GET", "/kontrak-karyawan/ktr-1"))?.status).toBe(404);
    expect((await onCall("GET", "/kontrak-karyawan/1"))?.status).toBe(404);
  });
});

/**
 * Satu test per rute baca, dua arah, dan yang dinyatakan adalah BARIS yang
 * dikembalikan — bukan statusnya. Pemindaian teks `SALARY_SCREENS` hanya
 * melihat berkas mana yang menyebut field gaji; bacaan yang melebar ke baris
 * yang bukan haknya tidak terlihat olehnya.
 */
describe("bacaan gaji", () => {
  // Urutan `effectiveFrom desc, id desc`: 0002 mendahului 0001 karena keduanya
  // mulai di hari yang sama.
  const SEEDED = [
    "KTR-0006",
    "KTR-0004",
    "KTR-0003",
    "KTR-0002",
    "KTR-0001",
    "KTR-0005",
  ];

  test("GET / mengembalikan tepat baris benihnya, dengan KONTRAK_KARYAWAN VIEW", async () => {
    const result = await onCall(
      "GET",
      "/kontrak-karyawan?limit=100",
      undefined,
      only(MENU.KONTRAK_KARYAWAN),
    );

    expect(result?.status).toBe(200);
    expect(codesOf(result?.body)).toEqual(SEEDED);
    expect(result?.body.totalData).toBe(SEEDED.length);
  });

  test("GET / tanpa KONTRAK_KARYAWAN VIEW mengembalikan nol baris", async () => {
    for (const slug of [MENU.PAYROLL, MENU.KARYAWAN, MENU.KOMPONEN_PAYROLL]) {
      const result = await onCall(
        "GET",
        "/kontrak-karyawan?limit=100",
        undefined,
        only(slug),
      );

      expect(result?.status, slug).toBe(403);
      expect(result?.body.data, slug).toBeUndefined();
    }
  });

  test("GET /:code mengembalikan kontrak yang diminta dan hanya itu", async () => {
    const result = await onCall(
      "GET",
      "/kontrak-karyawan/KTR-0001",
      undefined,
      only(MENU.KONTRAK_KARYAWAN),
    );

    expect(result?.status).toBe(200);
    expect(result?.body.data).toMatchObject({
      code: "KTR-0001",
      karyawanId: 1,
      karyawan: { code: "KRY-0001" },
    });
    expect(Array.isArray(result?.body.data)).toBe(false);
  });

  test("GET /:code tanpa KONTRAK_KARYAWAN VIEW mengembalikan nol baris", async () => {
    for (const slug of [MENU.PAYROLL, MENU.KARYAWAN, MENU.KOMPONEN_PAYROLL]) {
      const result = await onCall(
        "GET",
        "/kontrak-karyawan/KTR-0001",
        undefined,
        only(slug),
      );

      expect(result?.status, slug).toBe(403);
      expect(result?.body.data, slug).toBeUndefined();
    }
  });
});

describe("gerbang izin", () => {
  test("menu lain tidak membuka bacaannya", async () => {
    expect(
      (await onCall("GET", "/kontrak-karyawan", undefined, only(MENU.PAYROLL)))
        ?.status,
    ).toBe(403);
    expect(
      (
        await onCall(
          "GET",
          "/kontrak-karyawan",
          undefined,
          only(MENU.KONTRAK_KARYAWAN),
        )
      )?.status,
    ).toBe(200);
  });

  test("tiap metode minta aksinya sendiri", async () => {
    const viewOnly = (_slug: string, action: MockAction) => action === "VIEW";

    expect(
      (await onCall("POST", "/kontrak-karyawan", BODY, viewOnly as never))
        ?.status,
    ).toBe(403);
    expect(
      (
        await onCall(
          "DELETE",
          "/kontrak-karyawan/KTR-0001",
          undefined,
          viewOnly as never,
        )
      )?.status,
    ).toBe(403);
  });
});

describe("validasi tulis", () => {
  test("gaji nol dan negatif ditolak di fieldnya", async () => {
    for (const amount of [0, -1]) {
      const result = await onCall("POST", "/kontrak-karyawan", {
        ...BODY,
        basicSalary: amount,
      });

      expect(result?.status).toBe(400);
      expect(issuePathOf(result?.body)).toBe("basicSalary");
    }
  });

  test("dua desimal diterima, tiga ditolak", async () => {
    const ok = await onCall("POST", "/kontrak-karyawan", {
      ...BODY,
      basicSalary: 4200000.55,
    });

    expect(ok?.status).toBe(201);

    const bad = await onCall(
      "POST",
      "/kontrak-karyawan",
      otherBody({ basicSalary: 4200000.555 }),
    );

    expect(bad?.status).toBe(400);
    expect(issuePathOf(bad?.body)).toBe("basicSalary");
  });

  test("libur mingguan kosong ditolak, satu dan tiga hari diterima", async () => {
    const empty = await onCall("POST", "/kontrak-karyawan", {
      ...BODY,
      weeklyDayOff: [],
    });

    expect(empty?.status).toBe(400);
    expect(issuePathOf(empty?.body)).toBe("weeklyDayOff");

    expect((await onCall("POST", "/kontrak-karyawan", BODY))?.status).toBe(201);
    expect(
      (
        await onCall(
          "POST",
          "/kontrak-karyawan",
          otherBody({ weeklyDayOff: [1, 2, 0] }),
        )
      )?.status,
    ).toBe(201);
  });

  test("hari di luar 0–6 dan hari kembar ditolak", async () => {
    for (const days of [[7], [-1], [1, 1]]) {
      const result = await onCall("POST", "/kontrak-karyawan", {
        ...BODY,
        weeklyDayOff: days,
      });

      expect(result?.status).toBe(400);
      expect(issuePathOf(result?.body)).toBe("weeklyDayOff");
    }
  });

  test("libur mingguan boleh datang sebagai string JSON", async () => {
    const result = await onCall("POST", "/kontrak-karyawan", {
      ...BODY,
      weeklyDayOff: "[6, 0]",
    });

    expect(result?.status).toBe(201);
    expect(result?.body.data).toMatchObject({ weeklyDayOff: [6, 0] });
  });

  test("berlaku sampai sama hari diterima, sehari sebelum ditolak", async () => {
    const same = await onCall("POST", "/kontrak-karyawan", {
      ...BODY,
      effectiveTo: BODY.effectiveFrom,
    });

    expect(same?.status).toBe(201);

    const earlier = await onCall(
      "POST",
      "/kontrak-karyawan",
      otherBody({ effectiveFrom: "2001-01-02", effectiveTo: "2001-01-01" }),
    );

    expect(earlier?.status).toBe(400);
    expect(issuePathOf(earlier?.body)).toBe("effectiveTo");
  });

  test("jenis kontrak di luar enum ditolak", async () => {
    const result = await onCall("POST", "/kontrak-karyawan", {
      ...BODY,
      contractType: "MAGANG",
    });

    expect(result?.status).toBe(400);
    expect(issuePathOf(result?.body)).toBe("contractType");
  });

  test("jabatan 100 karakter diterima, 101 ditolak", async () => {
    expect(
      (
        await onCall("POST", "/kontrak-karyawan", {
          ...BODY,
          position: "A".repeat(100),
        })
      )?.status,
    ).toBe(201);

    const long = await onCall(
      "POST",
      "/kontrak-karyawan",
      otherBody({ position: "A".repeat(101) }),
    );

    expect(long?.status).toBe(400);
    expect(issuePathOf(long?.body)).toBe("position");
  });
});

describe("tumpang-tindih dan pemindahan", () => {
  test("periode yang bertabrakan menjawab 409 dengan kalimatnya", async () => {
    const result = await onCall("POST", "/kontrak-karyawan", {
      ...BODY,
      karyawanId: 2,
      effectiveFrom: "2000-01-01",
      effectiveTo: null,
    });

    expect(result?.status).toBe(409);
    expect(result?.body.error).toMatch(/sudah memiliki kontrak pada periode/i);
  });

  test("kontrak terbuka memblokir yang berikutnya sampai diberi tanggal akhir", async () => {
    const blocked = await onCall("POST", "/kontrak-karyawan", {
      ...BODY,
      karyawanId: 2,
      effectiveFrom: "2040-01-01",
      effectiveTo: null,
    });

    expect(blocked?.status).toBe(409);

    const closed = await onCall("PUT", "/kontrak-karyawan/KTR-0002", {
      karyawanId: 2,
      contractType: "TETAP",
      position: "Koster",
      basicSalary: 3200000,
      effectiveFrom: "2000-01-01",
      effectiveTo: "2039-12-31",
      weeklyDayOff: [1, 2],
      note: null,
    });

    expect(closed?.status).toBe(200);
    expect(
      (
        await onCall("POST", "/kontrak-karyawan", {
          ...BODY,
          karyawanId: 2,
          effectiveFrom: "2040-01-01",
          effectiveTo: null,
        })
      )?.status,
    ).toBe(201);
  });

  test("PUT dengan karyawan lain ditolak 400, bukan diam-diam 200", async () => {
    const result = await onCall("PUT", "/kontrak-karyawan/KTR-0001", {
      ...BODY,
      karyawanId: 3,
    });

    expect(result?.status).toBe(400);
    expect(result?.body.error).toMatch(/tidak dapat dipindahkan/i);
    expect(KARYAWAN_CONTRACT[0].karyawanId).toBe(1);
  });
});

describe("StepUp pada bacaan", () => {
  test("bacaan pertama 403 STEP_UP_REQUIRED, tulisnya tidak", async () => {
    process.env.MOCK_KTR_STEPUP = "1";

    const read = await onCall("GET", "/kontrak-karyawan");

    expect(read?.status).toBe(403);
    expect(read?.body.code).toBe("STEP_UP_REQUIRED");

    const write = await onCall("POST", "/kontrak-karyawan", BODY);

    expect(write?.status).toBe(201);
  });

  test("tanpa flag, bacaan tidak pernah meminta password", async () => {
    const result = await onCall("GET", "/kontrak-karyawan/KTR-0001");

    expect(result?.status).toBe(200);
    expect(result?.body.code).toBeUndefined();
  });
});

describe("hapus", () => {
  test("hapus membebaskan periodenya", async () => {
    expect((await onCall("DELETE", "/kontrak-karyawan/KTR-0002"))?.status).toBe(
      200,
    );
    expect((await onCall("GET", "/kontrak-karyawan/KTR-0002"))?.status).toBe(
      404,
    );
    expect(
      (
        await onCall("POST", "/kontrak-karyawan", {
          ...BODY,
          karyawanId: 2,
          effectiveFrom: "2000-01-01",
          effectiveTo: null,
        })
      )?.status,
    ).toBe(201);
  });

  test("flag slip gaji menolak hapus", async () => {
    process.env.MOCK_KTR_DELETE_ERROR = "1";

    const result = await onCall("DELETE", "/kontrak-karyawan/KTR-0002");

    expect(result?.status).toBe(400);
    expect(result?.body.error).toMatch(/slip gaji/i);
  });
});

describe("jalur lain tidak diklaim", () => {
  test("path di luar modulnya dilewatkan", async () => {
    expect(await onCall("GET", "/payroll")).toBeNull();
    expect(await onCall("GET", "/ddl/karyawan")).toBeNull();
  });
});
