import { describe, expect, test } from "bun:test";

import { MENU } from "../../../src/config/menu";
import type { MockAction } from "../kit";

import { tipeIbadahMock } from "./tipe-ibadah";

type Json = {
  status: number;
  error?: string;
  message?: string;
  issues?: { path: string; message: string }[];
  data?: unknown;
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
  const response = (await tipeIbadahMock({
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

const namesOf = (body: Json) =>
  (body.data as { name: string }[]).map((row) => row.name);

describe("mock /type-ibadah", () => {
  test("daftar urut nama; filter nama/kode dan isActive", async () => {
    const all = await onCall("GET", "/type-ibadah");
    expect(namesOf(all.body)).toEqual([
      "Ibadah Minggu I",
      "Ibadah Minggu II",
      "Ibadah Padang",
      "Ibadah Pemuda",
      "Persekutuan Doa",
    ]);

    const inactive = await onCall("GET", "/type-ibadah?isActive=false");
    expect(namesOf(inactive.body)).toEqual(["Ibadah Padang"]);

    const byCode = await onCall("GET", "/type-ibadah?filter=ibd-0003");
    expect(namesOf(byCode.body)).toEqual(["Persekutuan Doa"]);

    const none = await onCall("GET", "/type-ibadah?filter=zzz");
    expect(none).toEqual({
      status: 404,
      body: { status: 404, error: "Tipe Ibadah Tidak Ditemukan" },
    });
  });

  test("validasi jalan sebelum mencari code: PUT body salah ke code tak ada = 400", async () => {
    const result = await onCall("PUT", "/type-ibadah/TYP_IBD-9999", {
      name: "   ",
      isActive: "maybe",
    });

    expect(result.status).toBe(400);
    expect(result.body.error).toBe("Mohon Lengkapi Nama Tipe Ibadah");
    expect(result.body.issues?.map((issue) => issue.path)).toEqual([
      "name",
      "isActive",
    ]);
  });

  test("nama ganda tanpa peka huruf besar = 409; ganti kapitalisasi sendiri lolos", async () => {
    const duplicate = await onCall("POST", "/type-ibadah", {
      name: "ibadah  minggu i",
    });
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.error).toBe("Tipe Ibadah Sudah Tersedia");

    const recase = await onCall("PUT", "/type-ibadah/typ_ibd-0003", {
      name: "persekutuan doa",
      isActive: true,
    });
    expect(recase.status).toBe(200);

    await onCall("PUT", "/type-ibadah/TYP_IBD-0003", {
      name: "Persekutuan Doa",
      isActive: true,
    });
  });

  test("POST 201 kode lanjutan, isActive kosong = true; hapus tipe baru berhasil, tipe seed 400", async () => {
    const created = await onCall("POST", "/type-ibadah", {
      name: "  Ibadah   Syukur ",
      isActive: "",
    });
    expect(created.status).toBe(201);
    expect(created.body.data).toMatchObject({
      code: "TYP_IBD-0006",
      name: "Ibadah Syukur",
      isActive: true,
    });

    const used = await onCall("DELETE", "/type-ibadah/TYP_IBD-0001");
    expect(used.status).toBe(400);
    expect(used.body.error).toContain("Masih Digunakan oleh Data Ibadah");

    expect((await onCall("DELETE", "/type-ibadah/TYP_IBD-0006")).status).toBe(
      200,
    );
    expect((await onCall("GET", "/type-ibadah/TYP_IBD-0006")).status).toBe(404);
  });

  test("tanpa izin aksi: 403", async () => {
    const result = await onCall(
      "POST",
      "/type-ibadah",
      { name: "X" },
      (_slug, action) => action === "VIEW",
    );

    expect(result.status).toBe(403);
  });
});

describe("mock /ddl/type-ibadah", () => {
  test("semua tipe hidup dengan isActive, urut nama", async () => {
    const result = await onCall("GET", "/ddl/type-ibadah");

    expect(result.status).toBe(200);
    expect(result.body.data).toContainEqual({
      id: 5,
      code: "TYP_IBD-0005",
      name: "Ibadah Padang",
      isActive: false,
    });
    expect(namesOf(result.body)[0]).toBe("Ibadah Minggu I");
  });

  test("boleh dengan VIEW Ibadah saja; tanpa keduanya 403", async () => {
    const viaIbadah = await onCall(
      "GET",
      "/ddl/type-ibadah",
      undefined,
      (slug) => slug === MENU.IBADAH,
    );
    expect(viaIbadah.status).toBe(200);

    const none = await onCall(
      "GET",
      "/ddl/type-ibadah",
      undefined,
      () => false,
    );
    expect(none.status).toBe(403);
  });
});
