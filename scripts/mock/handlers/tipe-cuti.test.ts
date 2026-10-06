import { afterEach, beforeEach, describe, expect, test } from "bun:test";

import { MENU, type MenuSlug } from "../../../src/config/menu";
import type { MockAction } from "../kit";

import {
  LEAVE_TYPE,
  leaveTypeSeed,
  resetLeaveTypes,
  tipeCutiMock,
  type LeaveTypeRow,
} from "./tipe-cuti";

// Pedoman §7.2: benih datang dari modul yang menyemainya, bukan dari snapshot
// yang berkas ini ambil saat dimuat — snapshot itu merekam apa pun yang berkas
// sebelumnya tinggalkan.
const SEED = leaveTypeSeed();

const onReset = resetLeaveTypes;

const FLAGS = [
  "MOCK_EMPTY",
  "MOCK_500",
  "MOCK_DDL_EMPTY",
  "MOCK_TIPE_CUTI_IN_USE",
  "MOCK_TIPE_CUTI_SAVE_ERROR",
] as const;

beforeEach(onReset);

afterEach(() => {
  onReset();
  for (const flag of FLAGS) delete process.env[flag];
});

const ALL: MockAction[] = ["VIEW", "CREATE", "UPDATE", "DELETE"];

const onCall = async (
  method: string,
  target: string,
  options: {
    body?: unknown;
    granted?: Partial<Record<MenuSlug, MockAction[]>>;
  } = {},
) => {
  const url = new URL(`http://localhost:5003/api/v1${target}`);
  const granted = options.granted ?? { [MENU.TIPE_CUTI]: ALL };

  const response = await tipeCutiMock({
    request: new Request(url, {
      method,
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
      headers: { "content-type": "application/json" },
    }),
    url,
    path: url.pathname.replace("/api/v1", ""),
    method,
    can: (slug, action) => Boolean(granted[slug]?.includes(action)),
    isAdmin: false,
    sessionCode: "JMT-0001",
  });

  if (!response) return null;

  return {
    status: response.status,
    body: (await response.json()) as Record<string, unknown>,
  };
};

const VALID = {
  name: "Cuti Ujian",
  maxDaysPerYear: 4,
  isPaid: true,
  isActive: true,
};

describe("daftar", () => {
  test("mengembalikan yang tidak aktif juga — di sini ia dirawat", async () => {
    const result = await onCall("GET", "/tipe-cuti?limit=100");

    const rows = result?.body.data as unknown as LeaveTypeRow[];
    expect(result?.status).toBe(200);
    expect(rows.some((row) => !row.isActive)).toBe(true);
    expect(rows.map((row) => row.name)).toContain("Izin Tidak Dibayar");
  });

  test("urut nama, dan setiap baris membawa jatah, isPaid, isActive", async () => {
    const rows = (await onCall("GET", "/tipe-cuti?limit=100"))?.body
      .data as unknown as LeaveTypeRow[];

    expect(rows.map((row) => row.name)).toEqual(
      [...rows.map((row) => row.name)].sort((a, b) => a.localeCompare(b, "id")),
    );
    expect(Object.keys(rows[0]).sort()).toEqual([
      "code",
      "id",
      "isActive",
      "isPaid",
      "maxDaysPerYear",
      "name",
      "publicId",
    ]);
  });

  test("kolom audit tidak ikut terkirim", async () => {
    const rows = (await onCall("GET", "/tipe-cuti"))?.body
      .data as unknown as Record<string, unknown>[];

    for (const key of ["createdBy", "createdAt", "updatedBy", "deletedAt"]) {
      expect(rows[0]).not.toHaveProperty(key);
    }
  });

  test("filter nama case-insensitive", async () => {
    const rows = (await onCall("GET", "/tipe-cuti?filter=melahirkan"))?.body
      .data as unknown as LeaveTypeRow[];

    expect(rows.map((row) => row.name)).toEqual(["Cuti Melahirkan"]);
  });

  test("tidak cocok apa pun: 404, bukan daftar kosong (konvensi rumah)", async () => {
    const result = await onCall("GET", "/tipe-cuti?filter=zzz");

    expect(result?.status).toBe(404);
    expect(result?.body.error).toBe("Tipe Cuti Tidak Ditemukan");
  });

  test("MOCK_EMPTY: keadaan hari pertama", async () => {
    process.env.MOCK_EMPTY = "1";

    expect((await onCall("GET", "/tipe-cuti"))?.status).toBe(404);
  });

  test("MOCK_500", async () => {
    process.env.MOCK_500 = "1";

    expect((await onCall("GET", "/tipe-cuti"))?.status).toBe(500);
  });
});

describe("gerbang izin", () => {
  test("tanpa VIEW: 403 pada daftar", async () => {
    const result = await onCall("GET", "/tipe-cuti", { granted: {} });

    expect(result?.status).toBe(403);
  });

  test("VIEW tanpa CREATE: POST 403", async () => {
    const result = await onCall("POST", "/tipe-cuti", {
      body: VALID,
      granted: { [MENU.TIPE_CUTI]: ["VIEW"] },
    });

    expect(result?.status).toBe(403);
  });

  test("VIEW tanpa DELETE: DELETE 403", async () => {
    const result = await onCall("DELETE", "/tipe-cuti/TCT-0001", {
      granted: { [MENU.TIPE_CUTI]: ["VIEW", "UPDATE"] },
    });

    expect(result?.status).toBe(403);
  });
});

describe("tulis: null bukan nol", () => {
  test("maxDaysPerYear null diterima", async () => {
    const result = await onCall("POST", "/tipe-cuti", {
      body: { ...VALID, name: "Cuti Ibadah", maxDaysPerYear: null },
    });

    expect(result?.status).toBe(201);
    expect(result?.body.data).toMatchObject({ maxDaysPerYear: null });
  });

  test("maxDaysPerYear 0 ditolak di field harinya", async () => {
    const result = await onCall("POST", "/tipe-cuti", {
      body: { ...VALID, maxDaysPerYear: 0 },
    });

    expect(result?.status).toBe(400);
    expect(result?.body.issues).toEqual([
      {
        path: "maxDaysPerYear",
        message: "Jatah Hari Per Tahun harus bilangan bulat lebih dari 0",
      },
    ]);
  });

  test("maxDaysPerYear pecahan ditolak", async () => {
    const result = await onCall("POST", "/tipe-cuti", {
      body: { ...VALID, maxDaysPerYear: 2.5 },
    });

    expect(result?.status).toBe(400);
  });

  test("nama 50 diterima, 51 ditolak", async () => {
    expect(
      (
        await onCall("POST", "/tipe-cuti", {
          body: { ...VALID, name: "x".repeat(50) },
        })
      )?.status,
    ).toBe(201);
    expect(
      (
        await onCall("POST", "/tipe-cuti", {
          body: { ...VALID, name: "y".repeat(51) },
        })
      )?.status,
    ).toBe(400);
  });

  test("nama duplikat pada create: 409 ke field nama", async () => {
    const result = await onCall("POST", "/tipe-cuti", {
      body: { ...VALID, name: "cuti tahunan" },
    });

    expect(result?.status).toBe(409);
    expect(result?.body.issues).toEqual([
      { path: "name", message: "Tipe Cuti Sudah Tersedia" },
    ]);
  });

  test("update tanpa mengubah nama: lolos, bukan bentrok dengan dirinya", async () => {
    const result = await onCall("PUT", "/tipe-cuti/TCT-0001", {
      body: { ...VALID, name: "Cuti Tahunan", maxDaysPerYear: 15 },
    });

    expect(result?.status).toBe(200);
    expect(result?.body.data).toMatchObject({ maxDaysPerYear: 15 });
  });

  test("update ke nama tipe lain: 409", async () => {
    const result = await onCall("PUT", "/tipe-cuti/TCT-0001", {
      body: { ...VALID, name: "Cuti Sakit" },
    });

    expect(result?.status).toBe(409);
  });

  // S17: menurunkan jatah di bawah hari yang sudah diambil tidak dijaga
  // be-sada, dan mock meniru be-sada apa adanya.
  test("menurunkan jatah diterima, seperti be-sada hari ini", async () => {
    const result = await onCall("PUT", "/tipe-cuti/TCT-0001", {
      body: { ...VALID, name: "Cuti Tahunan", maxDaysPerYear: 1 },
    });

    expect(result?.status).toBe(200);
  });

  test("MOCK_TIPE_CUTI_SAVE_ERROR hanya menyentuh jalur tulis", async () => {
    process.env.MOCK_TIPE_CUTI_SAVE_ERROR = "500";

    expect((await onCall("GET", "/tipe-cuti"))?.status).toBe(200);
    expect((await onCall("POST", "/tipe-cuti", { body: VALID }))?.status).toBe(
      500,
    );
  });
});

describe("hapus", () => {
  test("soft delete mengeluarkannya dari daftar", async () => {
    expect((await onCall("DELETE", "/tipe-cuti/TCT-0005"))?.status).toBe(200);

    const rows = (await onCall("GET", "/tipe-cuti?limit=100"))?.body
      .data as unknown as LeaveTypeRow[];
    expect(rows.map((row) => row.code)).not.toContain("TCT-0005");
  });

  test("MOCK_TIPE_CUTI_IN_USE: pesan yang mengarahkan ke nonaktifkan", async () => {
    process.env.MOCK_TIPE_CUTI_IN_USE = "1";

    const result = await onCall("DELETE", "/tipe-cuti/TCT-0001");

    expect(result?.status).toBe(400);
    expect(result?.body.error).toMatch(/Nonaktifkan Saja, Jangan Dihapus/);
  });

  test("kode tak dikenal: 404", async () => {
    expect((await onCall("GET", "/tipe-cuti/TCT-9999"))?.status).toBe(404);
  });
});

describe("/ddl/tipe-cuti", () => {
  test("menyembunyikan yang tidak aktif, sementara daftar pengelolaan tidak", async () => {
    const picker = (await onCall("GET", "/ddl/tipe-cuti?limit=100"))?.body
      .data as unknown as LeaveTypeRow[];
    const managed = (await onCall("GET", "/tipe-cuti?limit=100"))?.body
      .data as unknown as LeaveTypeRow[];

    // Dinyatakan lewat BARIS yang kembali, bukan lewat flag di payload: ddl
    // sengaja tidak mengirim `isActive`, jadi `row.isActive` di sini selalu
    // undefined dan assertion yang membacanya hijau tanpa memeriksa apa pun.
    const inactive = SEED.filter((row) => !row.isActive).map((row) => row.code);

    expect(inactive.length).toBeGreaterThan(0);
    for (const code of inactive) {
      expect(picker.map((row) => row.code)).not.toContain(code);
      expect(managed.map((row) => row.code)).toContain(code);
    }
  });

  test("membawa maxDaysPerYear dan isPaid supaya form Cuti tak membaca dua kali", async () => {
    const rows = (await onCall("GET", "/ddl/tipe-cuti"))?.body
      .data as unknown as LeaveTypeRow[];

    expect(Object.keys(rows[0]).sort()).toEqual([
      "code",
      "id",
      "isPaid",
      "maxDaysPerYear",
      "name",
    ]);
  });

  test("tidak mengeluarkan baris yang sudah di-soft-delete", async () => {
    await onCall("DELETE", "/tipe-cuti/TCT-0004");

    const rows = (await onCall("GET", "/ddl/tipe-cuti?limit=100"))?.body
      .data as unknown as LeaveTypeRow[];
    expect(rows.map((row) => row.code)).not.toContain("TCT-0004");
  });

  test("guard any-of: CUTI VIEW saja cukup, nol grant 403", async () => {
    expect(
      (
        await onCall("GET", "/ddl/tipe-cuti", {
          granted: { [MENU.CUTI]: ["VIEW"] },
        })
      )?.status,
    ).toBe(200);
    expect(
      (
        await onCall("GET", "/ddl/tipe-cuti", {
          granted: { [MENU.KARYAWAN]: ["VIEW"] },
        })
      )?.status,
    ).toBe(403);
  });

  test("MOCK_DDL_EMPTY: 404, dan daftar pengelolaan tetap hidup", async () => {
    process.env.MOCK_DDL_EMPTY = "1";

    expect((await onCall("GET", "/ddl/tipe-cuti"))?.status).toBe(404);
    expect((await onCall("GET", "/tipe-cuti"))?.status).toBe(200);
  });
});

describe("path bukan miliknya", () => {
  test("handler mengembalikan null", async () => {
    expect(await onCall("GET", "/karyawan")).toBeNull();
    expect(await onCall("GET", "/ddl/karyawan")).toBeNull();
  });
});

// §7.2 lapis yang bisa dieksekusi: jalankan reset-nya lalu lihat hasilnya, jadi
// benih yang tercatat kosong atau tercemar membuat test ini merah.
describe("reset benih", () => {
  test("memulihkan larik yang sudah dikosongkan, bukan merekam kosongnya", () => {
    LEAVE_TYPE.length = 0;
    onReset();

    expect(LEAVE_TYPE).toHaveLength(SEED.length);
    expect(LEAVE_TYPE.map((row) => row.code)).toEqual(
      SEED.map((row) => row.code),
    );
  });

  test("memulihkan baris yang sudah disunting dan di-soft-delete", () => {
    LEAVE_TYPE[0].name = "Dirusak";
    LEAVE_TYPE[1].deletedAt = new Date().toISOString();
    onReset();

    expect(LEAVE_TYPE[0].name).toBe(SEED[0].name);
    expect(LEAVE_TYPE[1].deletedAt).toBeNull();
  });

  test("benih memuat tipe tidak aktif dan tipe tanpa batas — keduanya diuji di atas", () => {
    expect(SEED.some((row) => !row.isActive)).toBe(true);
    expect(SEED.some((row) => row.maxDaysPerYear === null)).toBe(true);
    expect(SEED.some((row) => !row.isPaid)).toBe(true);
  });
});

// Dicocokkan ke dropdown_list.{service,repository,controller}.ts be-sada
// `65f07f6`, bukan ke brief. SC membangun picker Cuti di atas ini.
describe("/ddl/tipe-cuti cocok dengan be-sada", () => {
  test("filter mencocokkan KODE, bukan nama saja", async () => {
    const rows = (await onCall("GET", "/ddl/tipe-cuti?filter=TCT-0003"))?.body
      .data as unknown as LeaveTypeRow[];

    expect(rows.map((row) => row.code)).toEqual(["TCT-0003"]);
  });

  test("filter kode case-insensitive dan sebagian", async () => {
    const rows = (await onCall("GET", "/ddl/tipe-cuti?filter=tct-000"))?.body
      .data as unknown as LeaveTypeRow[];

    expect(rows.length).toBeGreaterThan(1);
  });

  test("filter kode tidak menembus baris tidak aktif", async () => {
    const inactive = SEED.find((row) => !row.isActive);

    expect(inactive).toBeDefined();
    expect(
      (await onCall("GET", `/ddl/tipe-cuti?filter=${inactive?.code}`))?.status,
    ).toBe(404);
  });

  test("tanpa ?limit mengembalikan SEMUA baris aktif, bukan 20 pertama", async () => {
    const expected = SEED.filter((row) => row.isActive).length;

    for (let i = 0; i < 25; i++) {
      await onCall("POST", "/tipe-cuti", {
        body: { ...VALID, name: `Cuti Tambahan ${i}` },
      });
    }

    const rows = (await onCall("GET", "/ddl/tipe-cuti"))?.body
      .data as unknown as LeaveTypeRow[];

    expect(rows).toHaveLength(expected + 25);
    expect(rows.length).toBeGreaterThan(20);
  });

  test("?limit=0 dan ?limit kosong diperlakukan sebagai tanpa batas", async () => {
    const all = (await onCall("GET", "/ddl/tipe-cuti"))?.body
      .data as unknown as LeaveTypeRow[];

    for (const target of ["/ddl/tipe-cuti?limit=0", "/ddl/tipe-cuti?limit="]) {
      const rows = (await onCall("GET", target))?.body
        .data as unknown as LeaveTypeRow[];
      expect(rows).toHaveLength(all.length);
    }
  });

  test("?limit dipotong ke MAX_PAGE_SIZE 100", async () => {
    // Harus ada LEBIH dari 100 baris, atau assertion-nya hampa: dengan 30 baris
    // `Math.min(30, 100)` sama saja apakah batasnya dipasang atau tidak.
    for (let i = 0; i < 120; i++) {
      await onCall("POST", "/tipe-cuti", {
        body: { ...VALID, name: `Cuti Banyak ${i}` },
      });
    }

    const all = (await onCall("GET", "/ddl/tipe-cuti"))?.body
      .data as unknown as LeaveTypeRow[];
    expect(all.length).toBeGreaterThan(100);

    const capped = (await onCall("GET", "/ddl/tipe-cuti?limit=5000"))?.body
      .data as unknown as LeaveTypeRow[];
    expect(capped).toHaveLength(100);
  });

  test("pesan sukses sama persis dengan controller be-sada", async () => {
    expect((await onCall("GET", "/ddl/tipe-cuti"))?.body.message).toBe(
      "Berhasil Mendapatkan Semua Tipe Cuti",
    );
  });

  test("urut nama asc, dan setiap baris persis lima field select be-sada", async () => {
    const rows = (await onCall("GET", "/ddl/tipe-cuti"))?.body
      .data as unknown as LeaveTypeRow[];

    expect(rows.map((row) => row.name)).toEqual(
      [...rows.map((row) => row.name)].sort((a, b) => a.localeCompare(b, "id")),
    );
    for (const row of rows) {
      expect(Object.keys(row).sort()).toEqual([
        "code",
        "id",
        "isPaid",
        "maxDaysPerYear",
        "name",
      ]);
    }
  });
});
