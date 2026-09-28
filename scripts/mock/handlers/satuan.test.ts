import { afterEach, describe, expect, test } from "bun:test";

import { MENU } from "../../../src/config/menu";
import { UNIT } from "../inventaris-store";
import type { MockAction } from "../kit";

import { satuanMock } from "./satuan";

type Json = {
  status: number;
  error?: string;
  message?: string;
  issues?: { path: string; message: string }[];
  data?: unknown;
};

const SEED = UNIT.map((row) => ({ ...row }));

afterEach(() => {
  UNIT.splice(0, UNIT.length, ...SEED.map((row) => ({ ...row })));
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
  const response = await satuanMock({
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

const namesOf = (body: Json | undefined) =>
  (body?.data as { name: string }[]).map((row) => row.name);

describe("mock /unit", () => {
  test("daftar hidup urut nama, filter nama, kosong 404", async () => {
    const all = await onCall("GET", "/unit?limit=100");
    expect(namesOf(all?.body)).toEqual([
      "Botol",
      "Buah",
      "Kotak",
      "Lembar",
      "Lusin",
      "Pak",
      "Rim",
    ]);

    const filtered = await onCall("GET", "/unit?filter=bu");
    expect(namesOf(filtered?.body)).toEqual(["Buah"]);

    expect(await onCall("GET", "/unit?filter=dus")).toEqual({
      status: 404,
      body: { status: 404, error: "Satuan Tidak Ditemukan" },
    });
  });

  test("zod lebih dulu: nama kosong/panjang ke kode tak ada = 400 name", async () => {
    const blank = await onCall("PUT", "/unit/UNT-9999", { name: "   " });
    expect(blank?.status).toBe(400);
    expect(blank?.body.issues).toEqual([
      {
        path: "name",
        message: "Nama Satuan tidak boleh kurang dari 1 karakter",
      },
    ]);

    expect(
      (await onCall("POST", "/unit", { name: "x".repeat(31) }))?.body.error,
    ).toBe("Nama Satuan tidak boleh lebih dari 30 karakter");
    expect((await onCall("POST", "/unit", {}))?.body.error).toBe(
      "Mohon Lengkapi Nama Satuan",
    );
  });

  test("tambah: 201 dengan kode baru yang tidak bentrok; duplikat 409 name", async () => {
    const created = await onCall("POST", "/unit", { name: "  Kotak  Besar " });
    expect(created?.status).toBe(201);

    const row = created?.body.data as { code: string; name: string };
    expect(row.name).toBe("Kotak Besar");
    expect(UNIT.filter((item) => item.code === row.code)).toHaveLength(1);

    expect(await onCall("POST", "/unit", { name: "pak" })).toEqual({
      status: 409,
      body: {
        status: 409,
        error: "Satuan Sudah Tersedia",
        issues: [{ path: "name", message: "Satuan Sudah Tersedia" }],
      },
    });
  });

  test("ubah: ganti kapitalisasi sendiri lolos, nama milik satuan lain 409", async () => {
    const own = await onCall("PUT", "/unit/unt-0007", { name: "LEMBAR" });
    expect(own?.status).toBe(200);

    const clash = await onCall("PUT", "/unit/UNT-0007", { name: "Rim" });
    expect(clash?.status).toBe(409);
  });

  test("hapus: tanpa pemakai lolos, dipakai persediaan 400, terhapus lalu 404", async () => {
    expect((await onCall("DELETE", "/unit/UNT-0007"))?.status).toBe(200);
    expect((await onCall("GET", "/unit/UNT-0007"))?.status).toBe(404);

    expect(await onCall("DELETE", "/unit/UNT-0001")).toEqual({
      status: 400,
      body: {
        status: 400,
        error: "Satuan Tidak Dapat Dihapus Karena Terhubung dengan Data Barang",
      },
    });
  });

  test("guard per aksi; path lain bukan milik handler", async () => {
    const viewOnly = (slug: string, action: MockAction) =>
      slug === MENU.SATUAN && action === "VIEW";

    expect((await onCall("GET", "/unit", undefined, viewOnly))?.status).toBe(
      200,
    );
    expect(
      (await onCall("POST", "/unit", { name: "Baru" }, viewOnly))?.status,
    ).toBe(403);
    expect(await onCall("GET", "/ddl/unit")).toBeNull();
  });
});
