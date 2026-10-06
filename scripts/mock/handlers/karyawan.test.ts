import { afterEach, describe, expect, test } from "bun:test";

import { MENU, type MenuSlug } from "../../../src/config/menu";
import type { MockAction } from "../kit";

import { karyawanMock, resetKaryawanRows } from "./karyawan";

type Json = {
  status: number;
  error?: string;
  message?: string;
  totalData?: number;
  totalPage?: number;
  issues?: { path: string; message: string }[];
  data?: unknown;
};

afterEach(resetKaryawanRows);

const onCall = async (
  method: string,
  input: string,
  body?: unknown,
  can: (slug: MenuSlug, action: MockAction) => boolean = () => true,
) => {
  const url = new URL(`/api/v1${input}`, "http://mock.test");
  const response = await karyawanMock({
    request: new Request(url, {
      method,
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
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

const rowsOf = (body: Json | undefined) =>
  (body?.data as { code: string; name: string }[]) ?? [];

const BODY = {
  jemaatId: null,
  name: "Ruth Siahaan",
  phone: "081234567899",
  email: null,
  address: null,
  position: "Organis",
  joinDate: "2026-03-02",
  resignDate: null,
  status: "ACTIVE",
};

describe("mock /karyawan: daftar", () => {
  test("urut nama, 404 saat tidak ada yang cocok (konvensi rumah S23)", async () => {
    const all = await onCall("GET", "/karyawan?limit=100");

    expect(all?.status).toBe(200);
    expect(rowsOf(all?.body).map((row) => row.name)).toEqual([
      "Andreas Sitanggang",
      "Debora Manurung",
      "Fransiskawatihalimsitumorangnainggolanpanggabeansimorangkirtampubolon",
      "Gideon Tampubolon",
      "Hanna Simorangkir",
      "Immanuel Saragih",
      "Kevin Nainggolan",
      "Lidya Hutagalung",
    ]);

    expect(await onCall("GET", "/karyawan?filter=zzz")).toEqual({
      status: 404,
      body: { status: 404, error: "Karyawan Tidak Ditemukan" },
    });
  });

  test("filter mencocokkan nama ATAU jabatan, tanpa peduli huruf", async () => {
    expect(
      rowsOf((await onCall("GET", "/karyawan?filter=KOSTER"))?.body).map(
        (row) => row.code,
      ),
    ).toEqual(["KRY-0001"]);

    expect(
      rowsOf((await onCall("GET", "/karyawan?filter=debora"))?.body).map(
        (row) => row.code,
      ),
    ).toEqual(["KRY-0002"]);
  });

  // Nol filter `status` di be-sada `65f07f6` — SK-B1 belum mendarat, jadi mock
  // pun TIDAK boleh menerimanya: mock yang lebih longgar dari be-sada membuat
  // layar lolos di sini lalu salah di produksi.
  test("?status= diabaikan selama be-sada belum punya filternya", async () => {
    const filtered = await onCall("GET", "/karyawan?status=ACTIVE&limit=100");

    expect(filtered?.body.totalData).toBe(8);
  });

  test("paginasi: halaman 2 melanjutkan urutan server", async () => {
    const first = await onCall("GET", "/karyawan?limit=5");
    const second = await onCall("GET", "/karyawan?limit=5&page=2");

    expect(rowsOf(first?.body).length).toBe(5);
    expect(rowsOf(second?.body).map((row) => row.name)).toEqual([
      "Immanuel Saragih",
      "Kevin Nainggolan",
      "Lidya Hutagalung",
    ]);
    expect(first?.body.totalPage).toBe(2);
  });
});

// §2.9: kunci URL Karyawan adalah `code`. Dua arah — kode ketemu, bentuk kunci
// lain TIDAK, atau tautan salah kunci lolos di mock dan 404 di produksi.
describe("mock /karyawan: disiplin kunci", () => {
  test("kode ketemu, tanpa peduli huruf besar-kecil", async () => {
    expect((await onCall("GET", "/karyawan/KRY-0003"))?.status).toBe(200);
    expect((await onCall("GET", "/karyawan/kry-0003"))?.status).toBe(200);
  });

  test("autoincrement dan publicId TIDAK diterima", async () => {
    expect((await onCall("GET", "/karyawan/3"))?.status).toBe(404);
    expect((await onCall("GET", "/karyawan/karyawan-3"))?.status).toBe(404);
  });
});

describe("mock /karyawan: izin", () => {
  test("tiap metode dijaga aksi menunya sendiri", async () => {
    const only =
      (allowed: MockAction) => (slug: MenuSlug, action: MockAction) =>
        slug === MENU.KARYAWAN && action === allowed;

    expect(
      (await onCall("GET", "/karyawan", undefined, only("VIEW")))?.status,
    ).toBe(200);
    expect(
      (await onCall("POST", "/karyawan", BODY, only("VIEW")))?.status,
    ).toBe(403);
    expect(
      (await onCall("PUT", "/karyawan/KRY-0003", BODY, only("VIEW")))?.status,
    ).toBe(403);
    expect(
      (await onCall("DELETE", "/karyawan/KRY-0003", undefined, only("VIEW")))
        ?.status,
    ).toBe(403);
    expect(
      (await onCall("POST", "/karyawan", BODY, only("CREATE")))?.status,
    ).toBe(201);
  });

  test("menu lain tidak membuka Karyawan", async () => {
    expect(
      (
        await onCall(
          "GET",
          "/karyawan",
          undefined,
          (slug) => slug === MENU.CUTI,
        )
      )?.status,
    ).toBe(403);
  });
});

describe("mock /karyawan: validasi tulis", () => {
  test("wajib: nama, telepon, jabatan, tanggal bergabung", async () => {
    const empty = await onCall("POST", "/karyawan", {
      ...BODY,
      name: "",
      phone: "",
      position: "",
      joinDate: null,
    });

    expect(empty?.body.issues?.[0].path).toBe("name");

    expect(
      (await onCall("POST", "/karyawan", { ...BODY, phone: "" }))?.body
        .issues?.[0].path,
    ).toBe("phone");
    expect(
      (await onCall("POST", "/karyawan", { ...BODY, position: "" }))?.body
        .issues?.[0].path,
    ).toBe("position");
    expect(
      (await onCall("POST", "/karyawan", { ...BODY, joinDate: null }))?.body
        .issues?.[0].path,
    ).toBe("joinDate");
  });

  test("telepon hanya angka, email berbentuk nama@domain", async () => {
    expect(
      (await onCall("POST", "/karyawan", { ...BODY, phone: "0812-345" }))?.body
        .issues?.[0].message,
    ).toBe("No Handphone hanya boleh berisi angka");
    expect(
      (await onCall("POST", "/karyawan", { ...BODY, email: "bukan" }))?.body
        .issues?.[0].message,
    ).toBe("Format Email tidak valid");
  });

  test("tanggal berhenti lebih awal ditolak dengan pesan be-sada", async () => {
    expect(
      await onCall("POST", "/karyawan", {
        ...BODY,
        status: "RESIGNED",
        resignDate: "2026-03-01",
      }),
    ).toEqual({
      status: 400,
      body: {
        status: 400,
        error: "Tanggal Berhenti Tidak Boleh Lebih Awal Dari Tanggal Bergabung",
      },
    });
  });

  test("jemaat yang tidak ada ditolak 404", async () => {
    expect(
      await onCall("POST", "/karyawan", { ...BODY, jemaatId: 999 }),
    ).toEqual({
      status: 404,
      body: { status: 404, error: "Jemaat Tidak Ditemukan" },
    });
  });
});

describe("mock /karyawan: tulis", () => {
  test("POST memberi kode berurutan dan respons berbentuk respons baca", async () => {
    const created = await onCall("POST", "/karyawan", { ...BODY, jemaatId: 2 });
    const row = created?.body.data as {
      code: string;
      jemaat: { name: string } | null;
    };

    expect(created?.status).toBe(201);
    expect(row.code).toBe("KRY-0009");
    expect(row.jemaat?.name).toBe("Bethari Ayu Kusuma");
    expect((await onCall("GET", "/karyawan/KRY-0009"))?.status).toBe(200);
  });

  test("PUT adalah replace penuh: opsional yang dikirim null jadi null", async () => {
    const updated = await onCall("PUT", "/karyawan/KRY-0001", BODY);
    const row = updated?.body.data as {
      code: string;
      name: string;
      email: string | null;
      jemaat: unknown;
    };

    expect(row.code).toBe("KRY-0001");
    expect(row.name).toBe("Ruth Siahaan");
    expect(row.email).toBeNull();
    expect(row.jemaat).toBeNull();
  });

  test("DELETE membuang barisnya dari daftar", async () => {
    expect((await onCall("DELETE", "/karyawan/KRY-0005"))?.status).toBe(200);
    expect((await onCall("GET", "/karyawan/KRY-0005"))?.status).toBe(404);
    expect((await onCall("GET", "/karyawan?limit=100"))?.body.totalData).toBe(
      7,
    );
  });

  test("benih kembali utuh sesudah tiap test", async () => {
    expect((await onCall("GET", "/karyawan?limit=100"))?.body.totalData).toBe(
      8,
    );
    expect((await onCall("GET", "/karyawan/KRY-0005"))?.status).toBe(200);
  });
});

describe("mock /karyawan: bukan jalurnya", () => {
  test("path lain dilewatkan ke handler berikutnya", async () => {
    expect(await onCall("GET", "/kontrak-karyawan")).toBeNull();
    expect(await onCall("GET", "/ddl/karyawan")).toBeNull();
  });
});
