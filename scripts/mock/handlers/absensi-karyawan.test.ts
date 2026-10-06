import { afterEach, beforeEach, describe, expect, test } from "bun:test";

import { MENU } from "../../../src/config/menu";
import { addDays, todayJakarta } from "../../../src/lib/date";
import type { MockAction } from "../kit";

import { absensiKaryawanMock, resetAttendanceRows } from "./absensi-karyawan";
import { resetKaryawanRows } from "./karyawan";

const TODAY = todayJakarta();

type Row = {
  id: number;
  publicId: string;
  karyawanId: number;
  karyawan: { publicId: string; code: string; name: string } | null;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: string;
  note: string | null;
};

const onCall = (
  method: string,
  path: string,
  options: {
    body?: unknown;
    granted?: MockAction[];
  } = {},
) => {
  const granted = options.granted ?? ["VIEW", "CREATE", "UPDATE", "DELETE"];
  const url = new URL(`http://mock.test/api/v1${path}`);

  return absensiKaryawanMock({
    request: new Request(url, {
      method,
      ...(options.body === undefined
        ? {}
        : { body: JSON.stringify(options.body) }),
    }),
    url,
    path: url.pathname.replace(/^\/api\/v1/, ""),
    method,
    can: (slug, action) =>
      slug === MENU.ABSENSI_KARYAWAN && granted.includes(action),
    isAdmin: false,
    sessionCode: "test",
  });
};

const bodyOf = async <T>(response: Response | null) =>
  (await response!.json()) as T;

const payload = (overrides: Record<string, unknown> = {}) => ({
  karyawanId: 1,
  date: addDays(TODAY, -5),
  checkIn: "08:00",
  checkOut: "17:00",
  status: "HADIR",
  note: null,
  ...overrides,
});

// Pedoman §7.2: dua larik, dua reset milik modul penyemainya. Roster karyawan
// dimiliki `karyawan.ts` dan layar Karyawan menulisinya.
beforeEach(() => {
  resetAttendanceRows();
  resetKaryawanRows();
});

afterEach(() => {
  resetAttendanceRows();
  delete process.env.MOCK_ABSENSI_SAVE_ERROR;
  delete process.env.MOCK_ABSENSI_DELETE_ERROR;
  delete process.env.MOCK_EMPTY;
  delete process.env.MOCK_500;
});

describe("path bukan milik handler ini", () => {
  test("mengembalikan null, bukan 404", async () => {
    expect(await onCall("GET", "/karyawan")).toBeNull();
    expect(await onCall("GET", "/absensi-karyawan-lain")).toBeNull();
  });
});

describe("gerbang izin per aksi", () => {
  const cases: [string, string, MockAction][] = [
    ["GET", "/absensi-karyawan", "VIEW"],
    ["GET", "/absensi-karyawan/abs-0001", "VIEW"],
    ["POST", "/absensi-karyawan", "CREATE"],
    ["PUT", "/absensi-karyawan/abs-0001", "UPDATE"],
    ["DELETE", "/absensi-karyawan/abs-0001", "DELETE"],
  ];

  for (const [method, path, action] of cases) {
    test(`${method} ${path} butuh ${action}`, async () => {
      const all: MockAction[] = ["VIEW", "CREATE", "UPDATE", "DELETE"];

      const denied = await onCall(method, path, {
        body: payload(),
        granted: all.filter((it) => it !== action),
      });
      expect(denied?.status).toBe(403);

      const allowed = await onCall(method, path, {
        body: payload({ karyawanId: 2, date: addDays(TODAY, -9) }),
        granted: [action],
      });
      expect(allowed?.status).not.toBe(403);
    });
  }
});

describe("daftar", () => {
  test("urut tanggal menurun, dan id menurun di tanggal yang sama", async () => {
    const data = await bodyOf<{ data: Row[] }>(
      await onCall("GET", "/absensi-karyawan?limit=100"),
    );
    const dates = data.data.map((row) => row.date);

    expect([...dates].sort().reverse()).toEqual(dates);

    const sameDay = data.data.filter(
      (row) => row.date === `${TODAY}T00:00:00.000Z`,
    );
    expect(sameDay.map((row) => row.id)).toEqual(
      [...sameDay.map((row) => row.id)].sort((a, b) => b - a),
    );
  });

  test("kosong menjawab 404, konvensi rumah S23", async () => {
    const response = await onCall(
      "GET",
      `/absensi-karyawan?startDate=2000-01-01&endDate=2000-01-02`,
    );

    expect(response?.status).toBe(404);
  });

  test("status di luar enum ditolak 400 menyebut fieldnya", async () => {
    const response = await onCall("GET", "/absensi-karyawan?status=HADIRR");
    const body = await bodyOf<{ issues: { path: string }[] }>(response);

    expect(response?.status).toBe(400);
    expect(body.issues[0].path).toBe("status");
  });

  test("status yang sah menyaring", async () => {
    const body = await bodyOf<{ data: Row[] }>(
      await onCall("GET", "/absensi-karyawan?status=ALPA&limit=100"),
    );

    expect(body.data.every((row) => row.status === "ALPA")).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
  });

  test("karyawanId menyaring", async () => {
    const body = await bodyOf<{ data: Row[] }>(
      await onCall("GET", "/absensi-karyawan?karyawanId=2&limit=100"),
    );

    expect(body.data.every((row) => row.karyawanId === 2)).toBe(true);
  });

  test("masing-masing batas rentang berdiri sendiri", async () => {
    const from = await bodyOf<{ data: Row[] }>(
      await onCall(
        "GET",
        `/absensi-karyawan?startDate=${addDays(TODAY, -1)}&limit=100`,
      ),
    );
    expect(
      from.data.every((row) => row.date.slice(0, 10) >= addDays(TODAY, -1)),
    ).toBe(true);

    const until = await bodyOf<{ data: Row[] }>(
      await onCall(
        "GET",
        `/absensi-karyawan?endDate=${addDays(TODAY, -2)}&limit=100`,
      ),
    );
    expect(
      until.data.every((row) => row.date.slice(0, 10) <= addDays(TODAY, -2)),
    ).toBe(true);
  });

  test("setiap baris membawa karyawannya", async () => {
    const body = await bodyOf<{ data: Row[] }>(
      await onCall("GET", "/absensi-karyawan?limit=100"),
    );

    expect(
      body.data.every(
        (row) => row.karyawan !== null && row.karyawan.code.startsWith("KRY-"),
      ),
    ).toBe(true);
  });

  test("nol kolom audit di respons", async () => {
    const body = await bodyOf<{ data: Record<string, unknown>[] }>(
      await onCall("GET", "/absensi-karyawan?limit=100"),
    );

    for (const key of ["createdBy", "updatedBy", "createdAt", "updatedAt"]) {
      expect(Object.hasOwn(body.data[0], key)).toBe(false);
    }
  });
});

describe("tulis: tanggal", () => {
  test("hari ini diterima", async () => {
    // Prasyarat dinyatakan, bukan diandalkan: benih sudah mengisi hari ini
    // untuk keempat karyawan, jadi harinya dikosongkan dulu (pedoman §7.2).
    await onCall("DELETE", "/absensi-karyawan/abs-0002");

    const response = await onCall("POST", "/absensi-karyawan", {
      body: payload({ karyawanId: 2, date: TODAY, status: "LIBUR" }),
    });

    expect(response?.status).toBe(201);
  });

  test("besok ditolak 400 di field tanggal", async () => {
    const response = await onCall("POST", "/absensi-karyawan", {
      body: payload({ karyawanId: 2, date: addDays(TODAY, 1) }),
    });
    const body = await bodyOf<{ issues: { path: string }[]; error: string }>(
      response,
    );

    expect(response?.status).toBe(400);
    expect(body.issues[0].path).toBe("date");
    expect(body.error).toBe("Tanggal Absensi Tidak Boleh Melewati Hari Ini");
  });

  test("tanggal null ditolak, dan tidak jadi 1970-01-01", async () => {
    const response = await onCall("POST", "/absensi-karyawan", {
      body: payload({ date: null }),
    });
    const body = await bodyOf<{ error: string }>(response);

    expect(response?.status).toBe(400);
    expect(body.error).toBe("Mohon Lengkapi Tanggal");

    const listed = await bodyOf<{ data: Row[] }>(
      await onCall(
        "GET",
        "/absensi-karyawan?startDate=1970-01-01&endDate=1970-12-31",
      ),
    );
    expect(listed.data).toBeUndefined();
  });
});

describe("tulis: satu karyawan satu baris per tanggal", () => {
  test("tanggal ganda ditolak 409 di field tanggal", async () => {
    const response = await onCall("POST", "/absensi-karyawan", {
      body: payload({ karyawanId: 1, date: TODAY }),
    });
    const body = await bodyOf<{ issues: { path: string }[] }>(response);

    expect(response?.status).toBe(409);
    expect(body.issues[0].path).toBe("date");
  });

  test("suntingan boleh menyimpan harinya sendiri", async () => {
    const response = await onCall("PUT", "/absensi-karyawan/abs-0001", {
      body: payload({ karyawanId: 1, date: TODAY, status: "IZIN" }),
    });

    expect(response?.status).toBe(200);
    expect((await bodyOf<{ data: Row }>(response)).data.status).toBe("IZIN");
  });

  test("suntingan ke hari milik baris lain tetap 409", async () => {
    const response = await onCall("PUT", "/absensi-karyawan/abs-0001", {
      body: payload({ karyawanId: 1, date: addDays(TODAY, -1) }),
    });

    expect(response?.status).toBe(409);
  });

  test("update menulis karyawanId, dan pasangannya diperiksa ulang", async () => {
    const moved = await onCall("PUT", "/absensi-karyawan/abs-0001", {
      body: payload({ karyawanId: 3, date: addDays(TODAY, -6) }),
    });
    expect((await bodyOf<{ data: Row }>(moved)).data.karyawanId).toBe(3);

    const clash = await onCall("PUT", "/absensi-karyawan/abs-0002", {
      body: payload({ karyawanId: 3, date: addDays(TODAY, -6) }),
    });
    expect(clash?.status).toBe(409);
  });
});

describe("tulis: jam", () => {
  test("status di luar HADIR membuang kedua jam, bukan menolaknya", async () => {
    const response = await onCall("POST", "/absensi-karyawan", {
      body: payload({
        karyawanId: 2,
        date: addDays(TODAY, -8),
        status: "LIBUR",
        checkIn: "08:00",
        checkOut: "17:00",
      }),
    });
    const body = await bodyOf<{ data: Row }>(response);

    expect(response?.status).toBe(201);
    expect([body.data.checkIn, body.data.checkOut]).toEqual([null, null]);
  });

  test("HADIR menyimpan jamnya", async () => {
    const body = await bodyOf<{ data: Row }>(
      await onCall("POST", "/absensi-karyawan", {
        body: payload({ karyawanId: 2, date: addDays(TODAY, -8) }),
      }),
    );

    expect([body.data.checkIn, body.data.checkOut]).toEqual(["08:00", "17:00"]);
  });

  test("jam pulang lebih awal ditolak di field jam pulang", async () => {
    const response = await onCall("POST", "/absensi-karyawan", {
      body: payload({
        karyawanId: 2,
        date: addDays(TODAY, -8),
        checkIn: "09:00",
        checkOut: "08:59",
      }),
    });

    expect(response?.status).toBe(400);
    expect(
      (await bodyOf<{ issues: { path: string }[] }>(response)).issues[0].path,
    ).toBe("checkOut");
  });

  test("format jam salah ditolak", async () => {
    for (const checkIn of ["24:00", "8:00", "0800"]) {
      const response = await onCall("POST", "/absensi-karyawan", {
        body: payload({ karyawanId: 2, date: addDays(TODAY, -8), checkIn }),
      });

      expect(response?.status).toBe(400);
    }
  });
});

describe("tulis: karyawan dan catatan", () => {
  test("karyawan yang tidak ada menjawab 404", async () => {
    const response = await onCall("POST", "/absensi-karyawan", {
      body: payload({ karyawanId: 999, date: addDays(TODAY, -8) }),
    });

    expect(response?.status).toBe(404);
    expect((await bodyOf<{ error: string }>(response)).error).toBe(
      "Karyawan Tidak Ditemukan",
    );
  });

  test("karyawanId kosong, nol, dan pecahan ditolak 400", async () => {
    for (const karyawanId of [null, 0, 1.5, -3]) {
      const response = await onCall("POST", "/absensi-karyawan", {
        body: payload({ karyawanId, date: addDays(TODAY, -8) }),
      });

      expect(response?.status).toBe(400);
    }
  });

  test("catatan 251 karakter ditolak, 250 diterima", async () => {
    const tooLong = await onCall("POST", "/absensi-karyawan", {
      body: payload({
        karyawanId: 2,
        date: addDays(TODAY, -8),
        note: "a".repeat(251),
      }),
    });
    expect(tooLong?.status).toBe(400);

    const fits = await onCall("POST", "/absensi-karyawan", {
      body: payload({
        karyawanId: 2,
        date: addDays(TODAY, -8),
        note: "a".repeat(250),
      }),
    });
    expect(fits?.status).toBe(201);
  });

  test("status di luar enum ditolak 400", async () => {
    const response = await onCall("POST", "/absensi-karyawan", {
      body: payload({
        karyawanId: 2,
        date: addDays(TODAY, -8),
        status: "MANGKIR",
      }),
    });

    expect(response?.status).toBe(400);
  });
});

describe("hapus keras", () => {
  test("baris benar-benar hilang, bukan ditandai", async () => {
    const before = await bodyOf<{ totalData: number }>(
      await onCall("GET", "/absensi-karyawan?limit=100"),
    );

    expect((await onCall("DELETE", "/absensi-karyawan/abs-0001"))?.status).toBe(
      200,
    );

    const after = await bodyOf<{ totalData: number; data: Row[] }>(
      await onCall("GET", "/absensi-karyawan?limit=100"),
    );
    expect(after.totalData).toBe(before.totalData - 1);
    expect(after.data.some((row) => row.publicId === "abs-0001")).toBe(false);
    expect((await onCall("GET", "/absensi-karyawan/abs-0001"))?.status).toBe(
      404,
    );
  });

  test("hari yang dihapus boleh dicatat ulang — tanpa nisan yang menolaknya", async () => {
    const removed = await bodyOf<{ data: Row }>(
      await onCall("DELETE", "/absensi-karyawan/abs-0001"),
    );

    const again = await onCall("POST", "/absensi-karyawan", {
      body: payload({
        karyawanId: removed.data.karyawanId,
        date: removed.data.date.slice(0, 10),
      }),
    });

    expect(again?.status).toBe(201);
  });

  test("publicId tidak dikenal menjawab 404", async () => {
    expect((await onCall("DELETE", "/absensi-karyawan/abs-9999"))?.status).toBe(
      404,
    );
  });
});

describe("flag mock", () => {
  test("MOCK_EMPTY mengosongkan daftar", async () => {
    process.env.MOCK_EMPTY = "1";

    expect((await onCall("GET", "/absensi-karyawan"))?.status).toBe(404);
  });

  test("MOCK_500 menjatuhkan daftar", async () => {
    process.env.MOCK_500 = "1";

    expect((await onCall("GET", "/absensi-karyawan"))?.status).toBe(500);
  });

  test("MOCK_ABSENSI_SAVE_ERROR tiap bentuknya", async () => {
    const cases: [string, number][] = [
      ["500", 500],
      ["tanggal", 400],
      ["duplikat", 409],
      ["karyawan", 404],
    ];

    for (const [flag, status] of cases) {
      process.env.MOCK_ABSENSI_SAVE_ERROR = flag;

      const response = await onCall("POST", "/absensi-karyawan", {
        body: payload({ karyawanId: 2, date: addDays(TODAY, -8) }),
      });

      expect([flag, response?.status]).toEqual([flag, status]);
    }
  });

  test("MOCK_ABSENSI_DELETE_ERROR menjatuhkan hapus", async () => {
    process.env.MOCK_ABSENSI_DELETE_ERROR = "1";

    expect((await onCall("DELETE", "/absensi-karyawan/abs-0001"))?.status).toBe(
      500,
    );
  });
});

// §0.3 no. 2: layar ini nol angka gaji, jadi nol prompt password — dan nol
// nominal yang bisa bocor lewat handlernya.
describe("nol angka gaji", () => {
  test("respons tidak membawa field bernominal", async () => {
    const body = await bodyOf<{ data: Record<string, unknown>[] }>(
      await onCall("GET", "/absensi-karyawan?limit=100"),
    );
    const keys = Object.keys(body.data[0]).join(" ");

    expect(keys).not.toMatch(/salary|gaji|amount|nominal|net|gross/i);
  });
});
