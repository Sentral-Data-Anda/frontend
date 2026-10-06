import { afterEach, describe, expect, test } from "bun:test";

import { MENU } from "../../../src/config/menu";
import type { MockAction } from "../kit";

import { resetKaryawanRows } from "./karyawan";
import {
  KARYAWAN_PAYROLL_COMPONENT,
  PAYROLL_COMPONENT,
  komponenPayrollMock,
} from "./komponen-payroll";

type Json = {
  status: number;
  error?: string;
  message?: string;
  issues?: { path: string; message: string }[];
  data?: unknown;
};

const COMPONENT_SEED = PAYROLL_COMPONENT.map((row) => ({ ...row }));
const ASSIGNMENT_SEED = KARYAWAN_PAYROLL_COMPONENT.map((row) => ({ ...row }));

afterEach(() => {
  // Roster karyawan dimiliki `karyawan.ts` (pedoman §7.2) dan layar Karyawan
  // menulisinya; penetapan di sini membacanya lewat relasi.
  resetKaryawanRows();
  PAYROLL_COMPONENT.splice(
    0,
    PAYROLL_COMPONENT.length,
    ...COMPONENT_SEED.map((row) => ({ ...row })),
  );
  KARYAWAN_PAYROLL_COMPONENT.splice(
    0,
    KARYAWAN_PAYROLL_COMPONENT.length,
    ...ASSIGNMENT_SEED.map((row) => ({ ...row })),
  );
  delete process.env.MOCK_EMPTY;
  delete process.env.MOCK_DDL_EMPTY;
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
  const response = await komponenPayrollMock({
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

const codesOf = (body: Json | undefined) =>
  (body?.data as { code: string }[]).map((row) => row.code);

const COMPONENT = {
  name: "Tunjangan Makan",
  type: "EARNING",
  calculationType: "FIXED",
  defaultValue: 250000,
  isTaxable: true,
  isActive: true,
  accountId: null,
};

const ASSIGNMENT = {
  karyawanId: 4,
  payrollComponentId: 1,
  value: 200000,
  effectiveFrom: "2026-05-01",
  effectiveTo: null,
};

describe("mock katalog", () => {
  test("daftar urut jenis lalu nama, filter nama, dan PPH21 ikut tampil", async () => {
    const all = await onCall("GET", "/komponen-payroll?limit=100");

    expect(codesOf(all?.body)).toEqual([
      "KPY-0004",
      "KPY-0005",
      "PPH21",
      "KPY-0003",
      "KPY-0002",
      "KPY-0001",
    ]);

    const filtered = await onCall("GET", "/komponen-payroll?filter=koperasi");
    expect(codesOf(filtered?.body)).toEqual(["KPY-0005"]);
  });

  test("filter jenis divalidasi, bukan di-cast", async () => {
    expect(
      (await onCall("GET", "/komponen-payroll?type=EARNING"))?.status,
    ).toBe(200);
    expect((await onCall("GET", "/komponen-payroll?type=ENTAH"))?.status).toBe(
      400,
    );
  });

  test("kosong jadi 404, seperti be-sada", async () => {
    process.env.MOCK_EMPTY = "1";

    expect((await onCall("GET", "/komponen-payroll"))?.status).toBe(404);
  });

  test("kunci katalog adalah code, bukan publicId", async () => {
    expect((await onCall("GET", "/komponen-payroll/KPY-0001"))?.status).toBe(
      200,
    );
    expect((await onCall("GET", "/komponen-payroll/kpy-1"))?.status).toBe(404);
  });

  test("PPH21 ditolak di update DAN di delete", async () => {
    const updated = await onCall("PUT", "/komponen-payroll/PPH21", {
      ...COMPONENT,
      type: "EARNING",
    });
    expect(updated?.status).toBe(400);
    expect(updated?.body.error).toContain("Tidak Dapat Diubah");

    const deactivated = await onCall("PUT", "/komponen-payroll/PPH21", {
      ...COMPONENT,
      name: "PPh21",
      isActive: false,
    });
    expect(deactivated?.status).toBe(400);

    const removed = await onCall("DELETE", "/komponen-payroll/PPH21");
    expect(removed?.status).toBe(400);
    expect(removed?.body.error).toContain("Tidak Dapat Dihapus");
  });

  test("akun nonaktif ditolak saat menyimpan, dengan field accountId", async () => {
    const inactive = await onCall("POST", "/komponen-payroll", {
      ...COMPONENT,
      accountId: 25,
    });

    expect(inactive?.status).toBe(400);
    expect(inactive?.body.issues?.[0]?.path).toBe("accountId");

    const missing = await onCall("POST", "/komponen-payroll", {
      ...COMPONENT,
      accountId: 9999,
    });
    expect(missing?.status).toBe(404);
  });

  test("persentase di atas 100 ditolak, 100 diterima", async () => {
    const over = await onCall("POST", "/komponen-payroll", {
      ...COMPONENT,
      calculationType: "PERCENTAGE",
      defaultValue: 101,
    });
    expect(over?.status).toBe(400);
    expect(over?.body.issues?.[0]?.path).toBe("defaultValue");

    const edge = await onCall("POST", "/komponen-payroll", {
      ...COMPONENT,
      calculationType: "PERCENTAGE",
      defaultValue: 100,
    });
    expect(edge?.status).toBe(201);
  });

  test("defaultValue null disimpan sebagai null, nol ditolak", async () => {
    const created = await onCall("POST", "/komponen-payroll", {
      ...COMPONENT,
      defaultValue: null,
    });

    expect(
      (created?.body.data as { defaultValue: null }).defaultValue,
    ).toBeNull();
    expect(
      (
        await onCall("POST", "/komponen-payroll", {
          ...COMPONENT,
          name: "Nol",
          defaultValue: 0,
        })
      )?.status,
    ).toBe(400);
  });

  test("hapus komponen yang masih ditetapkan ditolak dengan arahan sendiri", async () => {
    const assigned = await onCall("DELETE", "/komponen-payroll/KPY-0001");

    expect(assigned?.status).toBe(400);
    expect(assigned?.body.error).toContain("Hapus Penetapannya Dulu");

    const free = await onCall("DELETE", "/komponen-payroll/KPY-0003");
    expect(free?.status).toBe(200);
  });
});

describe("mock penetapan", () => {
  test("urut berlaku dari turun, filter karyawan dan komponen", async () => {
    const all = await onCall("GET", "/komponen-payroll/karyawan?limit=100");
    const rows = all?.body.data as { publicId: string }[];

    expect(rows.map((row) => row.publicId)).toEqual([
      "kkp-5",
      "kkp-4",
      "kkp-3",
      "kkp-2",
      "kkp-1",
    ]);

    const perPerson = await onCall(
      "GET",
      "/komponen-payroll/karyawan?karyawanId=1",
    );
    expect((perPerson?.body.data as unknown[]).length).toBe(2);

    const perComponent = await onCall(
      "GET",
      "/komponen-payroll/karyawan?payrollComponentId=4",
    );
    expect((perComponent?.body.data as unknown[]).length).toBe(1);
  });

  test("kunci penetapan adalah publicId, bukan code dan bukan id", async () => {
    expect(
      (await onCall("GET", "/komponen-payroll/karyawan/kkp-1"))?.status,
    ).toBe(200);
    expect((await onCall("GET", "/komponen-payroll/karyawan/1"))?.status).toBe(
      404,
    );
    expect(
      (await onCall("GET", "/komponen-payroll/karyawan/KPY-0001"))?.status,
    ).toBe(404);
  });

  test("relasi penetapan membawa cara hitung, default, dan status komponen", async () => {
    const all = await onCall("GET", "/komponen-payroll/karyawan?limit=100");
    const rows = all?.body.data as {
      publicId: string;
      payrollComponent: {
        calculationType: string;
        defaultValue: string | null;
        isActive: boolean;
      };
    }[];

    // Tanpa ketiganya layar penetapan merender 2% sebagai "Rp 2", dan form
    // ubah atas komponen nonaktif kehilangan seluruh penjaganya.
    expect(
      rows.find((row) => row.publicId === "kkp-3")?.payrollComponent,
    ).toMatchObject({ calculationType: "PERCENTAGE", isActive: true });
    expect(
      rows.find((row) => row.publicId === "kkp-5")?.payrollComponent,
    ).toMatchObject({ isActive: false, defaultValue: "100000.00" });
  });

  test("respons tulis membawa relasi, sama seperti respons baca", async () => {
    const created = await onCall(
      "POST",
      "/komponen-payroll/karyawan",
      ASSIGNMENT,
    );
    const data = created?.body.data as {
      karyawan: { name: string };
      payrollComponent: { name: string };
    };

    expect(created?.status).toBe(201);
    expect(data.karyawan.name).toBe("Hanna Simorangkir");
    expect(data.payrollComponent.name).toBe("Tunjangan Transport");
  });

  test("tumpang-tindih menjawab 409 dengan kalimat yang menyebut bentrokannya", async () => {
    const clash = await onCall("POST", "/komponen-payroll/karyawan", {
      ...ASSIGNMENT,
      karyawanId: 1,
      payrollComponentId: 1,
      effectiveFrom: "2026-09-01",
    });

    expect(clash?.status).toBe(409);
    expect(clash?.body.error).toContain("periode yang dipilih");
  });

  test("pasangan yang berubah ditolak 400, bukan diterima diam-diam", async () => {
    const moved = await onCall("PUT", "/komponen-payroll/karyawan/kkp-1", {
      karyawanId: 2,
      payrollComponentId: 1,
      value: 100000,
      effectiveFrom: "2026-01-01",
      effectiveTo: null,
    });

    expect(moved?.status).toBe(400);
    expect(moved?.body.error).toContain("Tidak Dapat Dipindahkan");
  });

  test("nilai null atas komponen tanpa default ditolak di field nilai", async () => {
    const refused = await onCall("POST", "/komponen-payroll/karyawan", {
      ...ASSIGNMENT,
      payrollComponentId: 2,
      value: null,
    });

    expect(refused?.status).toBe(400);
    expect(refused?.body.issues?.[0]?.path).toBe("value");
  });

  test("berlaku sampai sebelum berlaku dari ditolak", async () => {
    const refused = await onCall("POST", "/komponen-payroll/karyawan", {
      ...ASSIGNMENT,
      effectiveTo: "2026-04-30",
    });

    expect(refused?.status).toBe(400);
    expect(refused?.body.issues?.[0]?.path).toBe("effectiveTo");
  });
});

describe("mock pemilih", () => {
  // Assertion ini dulu berbunyi "PPH21 ikut karena aktif" — hijau, dan
  // meng-encode cacatnya: komponen yang katalognya kunci masih bisa ditetapkan
  // ke seorang karyawan dari layar sebelahnya, lalu `markPaid` menolak run-nya
  // dengan akun yang tidak ada layarnya untuk diisi.
  test("/ddl/komponen-payroll hanya yang aktif, dan PPH21 TIDAK ditawarkan", async () => {
    const picker = await onCall("GET", "/ddl/komponen-payroll");

    expect(codesOf(picker?.body)).toEqual([
      "KPY-0004",
      "KPY-0003",
      "KPY-0002",
      "KPY-0001",
    ]);
    expect(codesOf(picker?.body)).not.toContain("PPH21");
  });

  test("PPH21 tetap ada di katalog walau hilang dari pemilih", async () => {
    const catalog = await onCall("GET", "/komponen-payroll?limit=100");

    expect(codesOf(catalog?.body)).toContain("PPH21");
  });

  test("/ddl/komponen-payroll membawa defaultValue supaya form tidak membaca dua kali", async () => {
    const picker = await onCall("GET", "/ddl/komponen-payroll");
    const rows = picker?.body.data as {
      code: string;
      calculationType: string;
      defaultValue: string | null;
    }[];

    expect(
      rows.find((row) => row.code === "KPY-0002")?.defaultValue,
    ).toBeNull();
    expect(rows.find((row) => row.code === "KPY-0004")).toMatchObject({
      calculationType: "PERCENTAGE",
      defaultValue: "1.00",
    });
  });

  test("pemilih kosong jadi 404", async () => {
    process.env.MOCK_DDL_EMPTY = "1";

    expect((await onCall("GET", "/ddl/komponen-payroll"))?.status).toBe(404);
  });

  // `/ddl/karyawan` dimiliki `karyawan.ts` bersama rosternya, dan diuji di
  // `karyawan.test.ts`. Berkas ini hanya membuktikan ia tidak diklaim di sini.
  test("/ddl/karyawan dilewatkan ke handler Karyawan", async () => {
    expect(await onCall("GET", "/ddl/karyawan")).toBeNull();
  });
});

describe("gerbang izin mock", () => {
  test("setiap aksi dijaga menunya sendiri", async () => {
    const viewOnly = (slug: string, action: MockAction) =>
      slug === MENU.KOMPONEN_PAYROLL && action === "VIEW";

    expect(
      (await onCall("GET", "/komponen-payroll", undefined, viewOnly))?.status,
    ).toBe(200);
    expect(
      (await onCall("POST", "/komponen-payroll", COMPONENT, viewOnly))?.status,
    ).toBe(403);
    expect(
      (await onCall("PUT", "/komponen-payroll/KPY-0001", COMPONENT, viewOnly))
        ?.status,
    ).toBe(403);
    expect(
      (
        await onCall(
          "DELETE",
          "/komponen-payroll/KPY-0003",
          undefined,
          viewOnly,
        )
      )?.status,
    ).toBe(403);
    expect(
      (await onCall("POST", "/komponen-payroll/karyawan", ASSIGNMENT, viewOnly))
        ?.status,
    ).toBe(403);
  });

  test("path lain dilewatkan ke handler berikutnya", async () => {
    expect(await onCall("GET", "/entah")).toBeNull();
    expect(await onCall("GET", "/ddl/entah")).toBeNull();
  });
});
