import { afterEach, describe, expect, test } from "bun:test";

import { MENU } from "../../../src/config/menu";
import { TYPE_ITEM } from "../inventaris-store";
import type { MockAction } from "../kit";

import { tipeBarangMock } from "./tipe-barang";

type Json = {
  status: number;
  error?: string;
  message?: string;
  issues?: { path: string; message: string }[];
  data?: unknown;
};

const SEED = TYPE_ITEM.map((row) => ({ ...row }));

afterEach(() => {
  TYPE_ITEM.splice(0, TYPE_ITEM.length, ...SEED.map((row) => ({ ...row })));
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
  const response = await tipeBarangMock({
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

describe("mock /type-item", () => {
  test("daftar hidup urut nama, filter nama, kosong 404", async () => {
    const all = await onCall("GET", "/type-item?limit=100");
    expect(namesOf(all?.body)).toEqual([
      "Alat Musik",
      "ATK",
      "Dekorasi",
      "Elektronik",
      "Kebersihan",
      "Kendaraan",
      "Mebel",
      "Perlengkapan Ibadah",
    ]);
    expect(Object.keys((all?.body.data as object[])[0]).sort()).toEqual([
      "accumulatedDepreciationAccount",
      "accumulatedDepreciationAccountId",
      "assetAccount",
      "assetAccountId",
      "code",
      "depreciationExpenseAccount",
      "depreciationExpenseAccountId",
      "id",
      "name",
      "publicId",
    ]);

    // Akun yang SUDAH DISELESAIKAN, bukan hanya id-nya. Layar membaca objek
    // ini; mock yang hanya mengirim id membuat setiap field terkunci berbunyi
    // "Belum diatur" betapa pun terisinya datanya, dan tinjauan visual apa
    // pun di atasnya meninjau kebohongan.
    const elektronik = (all?.body.data as Record<string, unknown>[]).find(
      (row) => row.name === "Elektronik",
    );
    expect(elektronik?.depreciationExpenseAccount).toMatchObject({
      code: "5-120",
      name: "Beban Penyusutan",
    });

    const atk = (all?.body.data as Record<string, unknown>[]).find(
      (row) => row.name === "ATK",
    );
    expect(atk?.depreciationExpenseAccount).toBeNull();

    const filtered = await onCall("GET", "/type-item?filter=ke");
    expect(namesOf(filtered?.body)).toEqual(["Kebersihan", "Kendaraan"]);

    expect(await onCall("GET", "/type-item?filter=zzz")).toEqual({
      status: 404,
      body: { status: 404, error: "Tipe Barang Tidak Ditemukan" },
    });
  });

  test("zod lebih dulu: nama pendek ke kode tak ada = 400 name", async () => {
    const result = await onCall("PUT", "/type-item/TYP_ITM-9999", {
      name: " a ",
    });

    expect(result?.status).toBe(400);
    expect(result?.body.issues).toEqual([
      {
        path: "name",
        message: "Nama Tipe Barang harus memiliki setidaknya 2 karakter",
      },
    ]);
    expect((await onCall("POST", "/type-item", {}))?.body.error).toBe(
      "Mohon Lengkapi Nama Tipe Barang",
    );
  });

  test("tambah: 201 dengan kode baru yang tidak bentrok; duplikat 409 name", async () => {
    const created = await onCall("POST", "/type-item", {
      name: "  tv   LED ",
    });
    expect(created?.status).toBe(201);

    const row = created?.body.data as { code: string; name: string };
    expect(row.name).toBe("tv LED");
    expect(TYPE_ITEM.filter((item) => item.code === row.code)).toHaveLength(1);

    expect(await onCall("POST", "/type-item", { name: "elektronik" })).toEqual({
      status: 409,
      body: {
        status: 409,
        error: "Tipe Barang Sudah Tersedia",
        issues: [{ path: "name", message: "Tipe Barang Sudah Tersedia" }],
      },
    });
  });

  test("ubah: ganti kapitalisasi sendiri lolos, nama milik tipe lain 409", async () => {
    const own = await onCall("PUT", "/type-item/typ_itm-0005", { name: "Atk" });
    expect(own?.status).toBe(200);

    const clash = await onCall("PUT", "/type-item/TYP_ITM-0005", {
      name: "Mebel",
    });
    expect(clash?.status).toBe(409);
  });

  test("hapus: tanpa pemakai lolos, dipakai barang 400, terhapus lalu 404", async () => {
    expect((await onCall("DELETE", "/type-item/TYP_ITM-0008"))?.status).toBe(
      200,
    );
    expect((await onCall("GET", "/type-item/TYP_ITM-0008"))?.status).toBe(404);

    expect(await onCall("DELETE", "/type-item/TYP_ITM-0001")).toEqual({
      status: 400,
      body: {
        status: 400,
        error:
          "Tipe Barang Tidak Dapat Dihapus Karena Terhubung dengan Data Barang",
      },
    });
  });

  test("guard per aksi; path lain bukan milik handler", async () => {
    const viewOnly = (slug: string, action: MockAction) =>
      slug === MENU.TIPE_BARANG && action === "VIEW";

    expect(
      (await onCall("GET", "/type-item", undefined, viewOnly))?.status,
    ).toBe(200);
    expect(
      (await onCall("POST", "/type-item", { name: "Baru" }, viewOnly))?.status,
    ).toBe(403);
    expect(await onCall("GET", "/ddl/type-item")).toBeNull();
  });
});
