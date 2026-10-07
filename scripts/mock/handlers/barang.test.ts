import { afterEach, describe, expect, test } from "bun:test";

import { ROOM } from "../fasilitas-store";
import { ASSET } from "../inventaris-store";
import type { MockAction } from "../kit";

import { barangMock } from "./barang";

type Json = {
  status: number;
  error?: string;
  message?: string;
  issues?: { path: string; message: string }[];
  totalData?: number;
  data?: unknown;
};

type View = {
  code: string;
  name: string;
  status: string;
  detailImage?: { publicId: string }[];
  disposal: { approval?: { publicId: string } | null } | null;
  depreciation?: { openingAccumulated: string; lastPeriod: unknown } | null;
};

const SNAPSHOT = ASSET.map((row) => ({
  ...row,
  detailImage: [...row.detailImage],
}));

afterEach(() => {
  ASSET.splice(
    0,
    ASSET.length,
    ...SNAPSHOT.map((row) => ({ ...row, detailImage: [...row.detailImage] })),
  );
});

const codeOf = (name: string) =>
  ASSET.find((row) => row.name === name && !row.deletedAt)!.code;

const INACTIVE_ROOM = ROOM.find((row) => !row.isActive && !row.deletedAt)!;

const formOf = (
  fields: Record<string, string>,
  files: [string, File][] = [],
) => {
  const body = new FormData();

  for (const [key, value] of Object.entries(fields)) body.append(key, value);
  for (const [field, file] of files) body.append(field, file);

  return body;
};

const photo = (name: string) =>
  new File([new Uint8Array(10)], name, { type: "image/jpeg" });

const VALID = {
  name: "Kipas Angin Miyako",
  description: "Kipas angin berdiri.",
  condition: "BAIK",
  acquisitionSource: "PURCHASE",
  isDepreciable: "0",
  typeId: "1",
  bapelId: "1",
  roomId: "1",
};

const onCall = async (
  method: string,
  input: string,
  body?: FormData,
  can: (slug: string, action: MockAction) => boolean = () => true,
) => {
  const url = new URL(`/api/v1${input}`, "http://mock.test");
  const request = new Request(url, { method });
  // FormData happy-dom tidak bisa diserialisasi Request asli Bun.
  if (body) request.formData = async () => body;

  const response = (await barangMock({
    request,
    url,
    path: input.split("?")[0],
    method,
    can,
    isAdmin: false,
    sessionCode: "test",
  })) as Response;

  return { status: response.status, body: (await response.json()) as Json };
};

const formFieldsOf = (row: (typeof ASSET)[number]) => ({
  name: row.name,
  description: row.description,
  serialNumber: row.serialNumber ?? "",
  condition: row.condition,
  acquisitionSource: row.acquisitionSource,
  donorName: row.donorName ?? "",
  acquisitionCost:
    row.acquisitionCost === null ? "" : String(row.acquisitionCost),
  isDepreciable: row.isDepreciable ? "1" : "0",
  usefulLifeMonths:
    row.usefulLifeMonths === null ? "" : String(row.usefulLifeMonths),
  salvageValue: row.salvageValue === null ? "" : String(row.salvageValue),
  depreciationStartDate: row.depreciationStartDate ?? "",
  openingAccumulatedDepreciation:
    row.openingAccumulatedDepreciation === null
      ? ""
      : String(row.openingAccumulatedDepreciation),
  openingAccumulatedAsOf: row.openingAccumulatedAsOf ?? "",
  typeId: String(row.typeId),
  bapelId: String(row.bapelId),
  roomId: String(row.roomId),
});

describe("baca", () => {
  test("daftar urut nama, filter status; tanpa izin 403", async () => {
    const all = await onCall("GET", "/asset?limit=100");
    const names = (all.body.data as View[]).map((row) => row.name);

    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, "id")));
    expect(names.filter((name) => name === "Kursi Lipat Chitose")).toHaveLength(
      2,
    );

    const pending = await onCall("GET", "/asset?status=menunggu");
    expect((pending.body.data as View[]).map((row) => row.name)).toEqual([
      "Printer Canon G2010",
    ]);

    const denied = await onCall("GET", "/asset", undefined, () => false);
    expect(denied.status).toBe(403);
  });

  test("detail: disposal.approval dan akumulasi awal bawaan 0", async () => {
    const printer = await onCall(
      "GET",
      `/asset/${codeOf("Printer Canon G2010")}`,
    );
    expect(
      (printer.body.data as View).disposal?.approval?.publicId,
    ).toBeTruthy();

    const keyboard = await onCall(
      "GET",
      `/asset/${codeOf("Keyboard Yamaha PSR-SX700").toLowerCase()}`,
    );
    expect((keyboard.body.data as View).depreciation?.openingAccumulated).toBe(
      "0",
    );
  });
});

describe("tambah", () => {
  test("tanpa foto 201; dengan 1 utama + 4 detail", async () => {
    const plain = await onCall("POST", "/asset", formOf(VALID));
    expect(plain.status).toBe(201);
    expect((plain.body.data as View).code).toMatch(/^AST_0001_0001-/);

    const withPhotos = await onCall(
      "POST",
      "/asset",
      formOf({ ...VALID, name: "Kipas Angin Kedua" }, [
        ["mainImage", photo("utama.jpg")],
        ...[1, 2, 3, 4].map((n): [string, File] => [
          "image",
          photo(`${n}.jpg`),
        ]),
      ]),
    );
    expect((withPhotos.body.data as View).detailImage).toHaveLength(4);
  });

  test("zod: wajib, nama pemberi untuk Beli, penyusutan bersyarat", async () => {
    const empty = await onCall("POST", "/asset", formOf({}));
    expect(empty.status).toBe(400);
    expect(empty.body.issues?.map((issue) => issue.path)).toEqual([
      "name",
      "description",
      "typeId",
      "bapelId",
      "roomId",
    ]);

    const donor = await onCall(
      "POST",
      "/asset",
      formOf({ ...VALID, donorName: "Keluarga X", usefulLifeMonths: "12" }),
    );
    expect(donor.body.issues).toEqual([
      {
        path: "donorName",
        message: "Nama Pemberi Hanya Untuk Donasi Atau Hibah",
      },
      {
        path: "usefulLifeMonths",
        message:
          "Field penyusutan hanya boleh diisi untuk barang yang disusutkan",
      },
    ]);

    const depreciable = await onCall(
      "POST",
      "/asset",
      formOf({
        ...VALID,
        isDepreciable: "1",
        openingAccumulatedDepreciation: "5",
      }),
    );
    expect(depreciable.body.issues?.map((issue) => issue.path)).toEqual([
      "acquisitionCost",
      "usefulLifeMonths",
      "depreciationStartDate",
      "openingAccumulatedAsOf",
    ]);
  });

  test("relasi 404 per field, ruang nonaktif 400, nomor seri 409", async () => {
    const relation = await onCall(
      "POST",
      "/asset",
      formOf({ ...VALID, typeId: "99", roomId: "99" }),
    );
    expect(relation.status).toBe(404);
    expect(relation.body.issues).toEqual([
      { path: "typeId", message: "Tipe Barang Tidak Ditemukan" },
      { path: "roomId", message: "Ruang Tidak Ditemukan" },
    ]);

    const inactive = await onCall(
      "POST",
      "/asset",
      formOf({ ...VALID, roomId: String(INACTIVE_ROOM.id) }),
    );
    expect(inactive.status).toBe(400);
    expect(inactive.body.issues).toEqual([
      { path: "roomId", message: "Ruang Tidak Aktif" },
    ]);

    const serial = await onCall(
      "POST",
      "/asset",
      formOf({ ...VALID, serialNumber: "x51-7q2k9031" }),
    );
    expect(serial.status).toBe(409);
    expect(serial.body.issues).toEqual([
      {
        path: "serialNumber",
        message: `Nomor Seri Sudah Dipakai ${codeOf("Proyektor Epson EB-X51")}`,
      },
    ]);
  });
});

describe("ubah dan hapus", () => {
  const proyektor = () =>
    ASSET.find(
      (row) => row.name === "Proyektor Epson EB-X51" && !row.deletedAt,
    )!;

  test("tanpa perubahan lolos; lepas satu foto detail + tambah satu", async () => {
    const row = proyektor();
    const [kept, , third] = row.detailImage;
    const response = await onCall(
      "PUT",
      `/asset/${row.code}`,
      formOf(
        {
          ...formFieldsOf(row),
          keepFiles: JSON.stringify(
            [kept, third].map((item) => ({
              publicId: item.publicId,
              showOnWebsite: false,
            })),
          ),
        },
        [["image", photo("baru.jpg")]],
      ),
    );

    expect(response.status).toBe(200);
    expect(
      (response.body.data as View).detailImage?.map((item) => item.publicId),
    ).toEqual([kept.publicId, third.publicId, expect.any(String)]);
  });

  test("pindah dan field terkunci → satu 400 dengan semua issues", async () => {
    const row = proyektor();
    const response = await onCall(
      "PUT",
      `/asset/${row.code}`,
      formOf({
        ...formFieldsOf(row),
        roomId: "2",
        acquisitionCost: "9000000",
        keepFiles: "[]",
      }),
    );

    expect(response.status).toBe(400);
    expect(response.body.issues).toEqual([
      { path: "roomId", message: "Pindahkan Barang Lewat Siklus Aset" },
      {
        path: "acquisitionCost",
        message: "Harga Perolehan Tidak Dapat Diubah Karena Sudah Disusutkan",
      },
    ]);
  });

  test("menunggu / dilepas: ubah dan hapus ditolak tanpa issues", async () => {
    const printer = ASSET.find((row) => row.name === "Printer Canon G2010")!;
    const put = await onCall(
      "PUT",
      `/asset/${printer.code}`,
      formOf(formFieldsOf(printer)),
    );
    expect(put.body).toEqual({
      status: 400,
      error: "Barang Sedang Menunggu Persetujuan Pelepasan",
    });

    const piano = await onCall("DELETE", `/asset/${codeOf("Piano Yamaha U1")}`);
    expect(piano.body.error).toBe(
      "Barang Sudah Dilepas Dan Tidak Dapat Diubah",
    );
  });

  test("hapus: sudah disusutkan ditolak; kamera lolos lalu 404", async () => {
    const posted = await onCall("DELETE", `/asset/${proyektor().code}`);
    expect(posted.body.error).toBe(
      "Barang Sudah Disusutkan. Gunakan Pelepasan Di Siklus Aset",
    );

    const code = codeOf("Kamera Canon EOS M50");
    const deleted = await onCall("DELETE", `/asset/${code}`);
    expect(deleted.body).toEqual({
      status: 200,
      message: "Berhasil Menghapus Barang",
      data: { code },
    });
    expect((await onCall("GET", `/asset/${code}`)).status).toBe(404);
  });
});
