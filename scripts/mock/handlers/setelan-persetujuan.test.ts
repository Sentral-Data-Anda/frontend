import { describe, expect, test } from "bun:test";

import { setelanPersetujuanMock } from "./setelan-persetujuan";

const call = async (
  method: string,
  pathAndQuery: string,
  body?: unknown,
  can = () => true,
) => {
  const url = new URL(`http://mock.test${pathAndQuery}`);
  const response = await setelanPersetujuanMock({
    request: new Request(url, {
      method,
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
    url,
    path: url.pathname,
    method,
    can,
    isAdmin: false,
    sessionCode: "test",
  });

  return { status: response?.status, body: await response?.json() };
};

const KAS_KECIL = "00000000-0000-4000-8000-000000000001";
const KAS_LAMA = "00000000-0000-4000-8000-000000000008";

const BODY = {
  name: "Kas keluar menengah",
  documentType: "CASH_EXPENSE",
  bapelId: null,
  minAmount: 5_000_000,
  maxAmount: 6_000_000,
  isActive: true,
  tiers: [{ roleUserId: 4, roleName: null, bapelId: null }],
};

describe("setelan-persetujuan mock setia be-sada", () => {
  test("rentang beririsan inklusif dengan alur aktif → 409 tanpa issues", async () => {
    const { status, body } = await call("POST", "/setelan-persetujuan", BODY);

    expect(status).toBe(409);
    expect(body.error).toMatch(/^Sudah ada alur persetujuan aktif/);
    expect(body.issues).toBeUndefined();
  });

  test("mengaktifkan alur lama yang beririsan → 409; khusus BP boleh beririsan umum", async () => {
    const lama = await call("GET", `/setelan-persetujuan/${KAS_LAMA}`);
    const reactivate = await call("PUT", `/setelan-persetujuan/${KAS_LAMA}`, {
      ...BODY,
      minAmount: 0,
      maxAmount: 10_000_000,
      name: lama.body.data.name,
    });
    const pemuda = await call("POST", "/setelan-persetujuan", {
      ...BODY,
      bapelId: 3,
    });

    expect(reactivate.status).toBe(409);
    expect(pemuda.status).toBe(201);
    expect(pemuda.body.message).toBe("Berhasil Membuat Alur Persetujuan");
    expect(pemuda.body.data.minAmount).toBe("5000000");
  });

  test("LOAN_ROOM ditolak dengan issues documentType", async () => {
    const { status, body } = await call("POST", "/setelan-persetujuan", {
      ...BODY,
      documentType: "LOAN_ROOM",
    });

    expect(status).toBe(400);
    expect(body.error).toBe("Jenis Dokumen tidak dikenali");
    expect(body.issues[0].path).toBe("documentType");
  });

  test("urutan cek: validasi dulu, lalu 404 alur, lalu role", async () => {
    const invalid = await call("PUT", "/setelan-persetujuan/tidak-ada", {
      ...BODY,
      name: "",
    });
    const missing = await call("PUT", "/setelan-persetujuan/tidak-ada", BODY);
    const role = await call("PUT", `/setelan-persetujuan/${KAS_KECIL}`, {
      ...BODY,
      tiers: [{ roleUserId: 99, roleName: null, bapelId: null }],
    });

    expect(invalid.body.error).toBe("Mohon Lengkapi Nama Alur");
    expect(missing.body.error).toBe("Alur Persetujuan Tidak Ditemukan");
    expect(role.body.error).toBe("Role Penyetuju Tidak Ditemukan");
  });

  test("filter isActive dan documentType; nilai lain diabaikan", async () => {
    const inactive = await call("GET", "/setelan-persetujuan?isActive=false");
    const ignored = await call(
      "GET",
      "/setelan-persetujuan?isActive=ya&documentType=XYZ",
    );

    expect(
      inactive.body.data.every((row: { isActive: boolean }) => !row.isActive),
    ).toBe(true);
    expect(ignored.body.totalData).toBeGreaterThan(inactive.body.totalData);
  });

  test("DELETE menonaktifkan tanpa data", async () => {
    const created = await call("POST", "/setelan-persetujuan", {
      ...BODY,
      documentType: "PAYROLL_RUN",
    });
    const { status, body } = await call(
      "DELETE",
      `/setelan-persetujuan/${created.body.data.publicId}`,
    );

    expect(status).toBe(200);
    expect(body).toEqual({
      status: 200,
      message: "Berhasil Menonaktifkan Alur Persetujuan",
    });
  });

  test("ddl jabatan: bapelId tak sah 400, BP tanpa jabatan 404, gabung beda huruf", async () => {
    const invalid = await call("GET", "/ddl/jabatan-jemaat?bapelId=1.5");
    const empty = await call("GET", "/ddl/jabatan-jemaat?bapelId=6");
    const wanita = await call("GET", "/ddl/jabatan-jemaat?bapelId=3");
    const denied = await call(
      "GET",
      "/ddl/jabatan-jemaat",
      undefined,
      () => false,
    );

    expect(invalid.status).toBe(400);
    expect(invalid.body.issues).toEqual([
      { path: "bapelId", message: "Bapel tidak valid" },
    ]);
    expect(empty.body).toEqual({
      status: 404,
      error: "Jabatan Tidak Ditemukan",
    });
    expect(wanita.body.data).toEqual([
      { name: "Bendahara" },
      { name: "Ketua" },
      { name: "sekretaris" },
    ]);
    expect(denied.status).toBe(403);
  });
});
