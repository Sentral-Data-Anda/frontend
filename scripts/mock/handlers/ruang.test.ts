import { afterEach, describe, expect, test } from "bun:test";

import { ROOM } from "../fasilitas-store";
import type { MockAction } from "../kit";

import { ruangMock } from "./ruang";

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
  isActive: boolean;
  mainImage: { publicId: string } | null;
  detailImage: { publicId: string; name: string }[];
};

const SNAPSHOT = ROOM.map((row) => ({
  ...row,
  detailImage: [...row.detailImage],
}));

afterEach(() => {
  ROOM.splice(
    0,
    ROOM.length,
    ...SNAPSHOT.map((row) => ({ ...row, detailImage: [...row.detailImage] })),
  );
  delete process.env.MOCK_ROOM_HAS_BARANG;
});

const photo = (name: string) =>
  new File([new Uint8Array(10)], name, { type: "image/jpeg" });

const formOf = (
  fields: Record<string, string>,
  files: [string, File][] = [],
) => {
  const body = new FormData();

  for (const [key, value] of Object.entries(fields)) body.append(key, value);
  for (const [field, file] of files) body.append(field, file);

  return body;
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

  const response = (await ruangMock({
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

describe("daftar", () => {
  test("ruang hidup urut nama; isActive=0 hanya nonaktif; tanpa izin 403", async () => {
    const all = await onCall("GET", "/room?limit=100");
    const names = (all.body.data as View[]).map((row) => row.name);

    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
    expect(names).not.toContain("Perpustakaan");

    const inactive = await onCall("GET", "/room?isActive=0");
    expect((inactive.body.data as View[]).map((row) => row.name)).toEqual([
      "Kelas Sekolah Minggu",
    ]);

    expect((await onCall("GET", "/room", undefined, () => false)).status).toBe(
      403,
    );
  });
});

describe("tulis", () => {
  test("POST: 409 nama kembar tanpa peka huruf besar; isActive kosong = aktif", async () => {
    const duplicate = await onCall(
      "POST",
      "/room",
      formOf({ name: "aula  serbaguna", capacity: "10", isActive: "1" }),
    );
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.issues).toEqual([
      { path: "name", message: "Ruang Sudah Tersedia" },
    ]);

    const created = await onCall(
      "POST",
      "/room",
      formOf({ name: "Ruang Doa", capacity: "8" }),
    );
    expect(created.status).toBe(201);
    expect(created.body.data).toMatchObject({
      code: "RM-0007",
      isActive: true,
      mainImage: null,
      detailImage: [],
    });
  });

  test("POST: validasi zod berurutan", async () => {
    const failed = await onCall(
      "POST",
      "/room",
      formOf({ name: "abc", capacity: "1.5" }),
    );

    expect(failed.status).toBe(400);
    expect(failed.body.issues).toEqual([
      {
        path: "name",
        message: "Nama Ruang harus memiliki setidaknya 4 karakter",
      },
      { path: "capacity", message: "Kapasitas Ruang Harus Bilangan Bulat" },
    ]);
  });

  test("PUT: isActive 0 tersimpan; keepFiles + image baru; ganti huruf besar nama sendiri lolos", async () => {
    const saved = await onCall(
      "PUT",
      "/room/rm-0002",
      formOf(
        {
          name: "AULA SERBAGUNA",
          capacity: "150",
          isActive: "0",
          keepFiles: JSON.stringify([
            {
              publicId: SNAPSHOT[1].detailImage[1].publicId,
              showOnWebsite: false,
            },
          ]),
        },
        [["image", photo("baru.jpg")]],
      ),
    );

    expect(saved.status).toBe(200);
    const room = saved.body.data as View;
    expect(room.isActive).toBe(false);
    expect(room.name).toBe("AULA SERBAGUNA");
    expect(room.detailImage.map((item) => item.name)).toEqual([
      SNAPSHOT[1].detailImage[1].name,
      "baru",
    ]);
    expect(room.mainImage?.publicId).toBe(SNAPSHOT[1].mainImage?.publicId);
  });

  test("PUT: keepFiles [] melepas semua; foto asing ditolak; lebih dari 4 ditolak", async () => {
    const cleared = await onCall(
      "PUT",
      "/room/RM-0001",
      formOf({ name: "Gedung Gereja", capacity: "400", keepFiles: "[]" }),
    );
    expect((cleared.body.data as View).detailImage).toEqual([]);

    const foreign = await onCall(
      "PUT",
      "/room/RM-0002",
      formOf({
        name: "Aula Serbaguna",
        capacity: "150",
        keepFiles: JSON.stringify([{ publicId: "x", showOnWebsite: false }]),
      }),
    );
    expect(foreign.body.issues).toEqual([
      { path: "detailImage", message: "Foto Tidak Ditemukan" },
    ]);

    const tooMany = await onCall(
      "PUT",
      "/room/RM-0002",
      formOf(
        {
          name: "Aula Serbaguna",
          capacity: "150",
          keepFiles: JSON.stringify(
            SNAPSHOT[1].detailImage.map((item) => ({
              publicId: item.publicId,
              showOnWebsite: false,
            })),
          ),
        },
        [
          ["image", photo("a.jpg")],
          ["image", photo("b.jpg")],
          ["image", photo("c.jpg")],
        ],
      ),
    );
    expect(tooMany.body.error).toBe("Foto Detail Ruang Maksimal 4");
  });
});

describe("hapus dan pemakaian", () => {
  test("DELETE ditolak berurutan: barang, peminjaman, event", async () => {
    process.env.MOCK_ROOM_HAS_BARANG = "1";
    expect((await onCall("DELETE", "/room/RM-0005")).body.error).toBe(
      "Ruang Tidak Dapat Dihapus Karena Terhubung dengan Data Barang",
    );
    delete process.env.MOCK_ROOM_HAS_BARANG;

    expect((await onCall("DELETE", "/room/RM-0004")).body.error).toMatch(
      /^Ruang Tidak Dapat Dihapus Karena Masih Memiliki \d+ Peminjaman Mendatang$/,
    );
    expect((await onCall("DELETE", "/room/RM-0003")).body.error).toMatch(
      /Masih Memiliki \d+ Event Mendatang$/,
    );

    const removed = await onCall("DELETE", "/room/RM-0005");
    expect(removed.body.message).toBe("Berhasil Menghapus Ruang");
    expect((await onCall("GET", "/room/RM-0005")).status).toBe(404);
  });

  test("usage: tanggal YYYY-MM-DD urut; kosong 404", async () => {
    const usage = await onCall("GET", "/room/RM-0001/usage");
    const rows = usage.body.data as { date: string; startTime: string }[];

    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((row) => /^\d{4}-\d{2}-\d{2}$/.test(row.date))).toBe(
      true,
    );
    expect(rows.map((row) => row.date + row.startTime)).toEqual(
      [...rows.map((row) => row.date + row.startTime)].sort(),
    );

    expect((await onCall("GET", "/room/RM-0005/usage")).body.error).toBe(
      "Pemakaian Ruang Tidak Ditemukan",
    );
  });
});
