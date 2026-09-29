import { afterEach, describe, expect, test } from "bun:test";

import { MENU } from "../../../src/config/menu";
import type { MockAction } from "../kit";
import { SUPPLIER } from "../pengadaan-store";

import { supplierMock } from "./supplier";

type Json = {
  status: number;
  error?: string;
  message?: string;
  issues?: { path: string; message: string }[];
  totalData?: number;
  data?: unknown;
};

type Row = { code: string; name: string; isActive: boolean };

const SEED = SUPPLIER.map((row) => ({ ...row }));

afterEach(() => {
  SUPPLIER.splice(0, SUPPLIER.length, ...SEED.map((row) => ({ ...row })));
});

const BODY = {
  name: "  Toko   Baru  ",
  contactPerson: "",
  phone: "081234567890",
  email: "",
  address: null,
  npwp: null,
  bankName: null,
  bankAccountNumber: null,
  bankAccountName: null,
  isActive: true,
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
  const response = await supplierMock({
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

const rowsOf = (body: Json | undefined) => body?.data as Row[];

describe("mock /supplier", () => {
  test("daftar hidup urut nama tanpa kolom audit; cari kode/telepon; isActive", async () => {
    const all = await onCall("GET", "/supplier?limit=100");
    expect(rowsOf(all?.body).map((row) => row.name)).toEqual([
      "Bengkel Jaya",
      "CV Lama Jaya",
      "CV Sinar Teknik",
      "PT Sejuk Selalu",
      "Toko Buku Agape",
      "Toko Mebel Sentosa",
      "Toko Musik Harmoni",
    ]);
    expect(Object.keys((all?.body.data as object[])[0]).sort()).toEqual([
      "address",
      "bankAccountName",
      "bankAccountNumber",
      "bankName",
      "code",
      "contactPerson",
      "email",
      "id",
      "isActive",
      "name",
      "npwp",
      "phone",
      "publicId",
    ]);

    const byPhone = await onCall("GET", "/supplier?filter=0614512330");
    expect(rowsOf(byPhone?.body).map((row) => row.code)).toEqual(["SUP-0003"]);

    const inactive = await onCall("GET", "/supplier?isActive=false");
    expect(rowsOf(inactive?.body).map((row) => row.name)).toEqual([
      "CV Lama Jaya",
    ]);

    expect(await onCall("GET", "/supplier?filter=zzz")).toEqual({
      status: 404,
      body: { status: 404, error: "Supplier Tidak Ditemukan" },
    });
  });

  test("tambah: nama dilebur, kode SUP berikutnya; duplikat 409 di name", async () => {
    const created = await onCall("POST", "/supplier", BODY);
    expect(created?.status).toBe(201);
    expect(created?.body.data).toMatchObject({
      code: "SUP-0009",
      name: "Toko Baru",
      contactPerson: null,
      email: null,
    });

    const duplicate = await onCall("POST", "/supplier", {
      ...BODY,
      name: "toko baru",
    });
    expect(duplicate).toEqual({
      status: 409,
      body: {
        status: 409,
        error: "Supplier Sudah Tersedia",
        issues: [{ path: "name", message: "Supplier Sudah Tersedia" }],
      },
    });
  });

  test("zod: telepon wajib angka ≤ 15, email bentuk, panjang field", async () => {
    const invalid = await onCall("POST", "/supplier", {
      ...BODY,
      name: "",
      phone: "0812-34",
      email: "bukan-email",
      npwp: "1".repeat(26),
    });
    expect(invalid?.status).toBe(400);
    expect(invalid?.body.issues).toEqual([
      { path: "name", message: "Mohon Lengkapi Nama Supplier" },
      { path: "phone", message: "No Telepon hanya boleh berisi angka" },
      { path: "email", message: "Format Email tidak valid" },
      { path: "npwp", message: "NPWP tidak boleh lebih dari 25 karakter" },
    ]);
  });

  test("ubah: nama sendiri beda huruf boleh, nama lain 409; kode tanpa peka huruf", async () => {
    const renamed = await onCall("PUT", "/supplier/sup-0004", {
      ...BODY,
      name: "BENGKEL JAYA",
      isActive: false,
    });
    expect(renamed?.body.data).toMatchObject({
      name: "BENGKEL JAYA",
      isActive: false,
    });

    const clash = await onCall("PUT", "/supplier/SUP-0004", {
      ...BODY,
      name: "Toko Buku Agape",
    });
    expect(clash?.status).toBe(409);

    expect((await onCall("PUT", "/supplier/SUP-9999", BODY))?.status).toBe(404);
  });

  test("hapus: dipakai pesanan/perawatan 400; belum dipakai terhapus", async () => {
    expect(await onCall("DELETE", "/supplier/SUP-0001")).toEqual({
      status: 400,
      body: {
        status: 400,
        error:
          "Supplier Tidak Dapat Dihapus Karena Terhubung dengan Data Pengadaan. Nonaktifkan Saja",
      },
    });

    const created = await onCall("POST", "/supplier", BODY);
    const code = (created?.body.data as Row).code;

    expect((await onCall("DELETE", `/supplier/${code}`))?.body.message).toBe(
      "Berhasil Menghapus Supplier",
    );
    expect((await onCall("GET", `/supplier/${code}`))?.status).toBe(404);
  });

  test("guard per aksi; path lain bukan milik handler", async () => {
    const viewOnly = (slug: string, action: MockAction) =>
      slug === MENU.SUPPLIER && action === "VIEW";

    expect(
      (await onCall("GET", "/supplier/SUP-0001", undefined, viewOnly))?.status,
    ).toBe(200);
    expect(
      (await onCall("DELETE", "/supplier/SUP-0001", undefined, viewOnly))
        ?.status,
    ).toBe(403);
    expect(await onCall("GET", "/supplier-lain")).toBeNull();
  });
});
