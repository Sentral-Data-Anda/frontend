import { describe, expect, test } from "bun:test";

import type { AttachmentValue } from "@/types/attachment";

import {
  EMPTY_GALERI_FORM,
  galeriFormSchema,
  replaceDescriptionOf,
  serverFieldError,
  toGaleriForm,
  toGaleriFormData,
  websiteCellOf,
  websiteStatusOf,
  type GaleriFormValues,
} from "./model";
import type { Album } from "./types";

const photo = (name: string, showOnWebsite = false): AttachmentValue => ({
  key: name,
  name,
  mimeType: "image/jpeg",
  url: `blob:${name}`,
  showOnWebsite,
  file: new File(["x"], `${name}.jpg`, { type: "image/jpeg" }),
});

const VALID: GaleriFormValues = {
  ...EMPTY_GALERI_FORM,
  name: "Retret Pemuda 2026",
  bapelId: "2",
  listImage: [photo("api")],
};

const ALBUM: Album = {
  code: "ALBM_0002-0001",
  name: "Retret Pemuda 2025",
  isPublish: true,
  bapel: { id: 2, code: "BPL-2", name: "Komisi Pemuda" },
  listImage: [
    {
      publicId: "a",
      name: "Api unggun",
      mimeType: "image/jpeg",
      size: 1,
      showOnWebsite: true,
      url: "http://m/a",
    },
    {
      publicId: "b",
      name: "Sesi pagi",
      mimeType: "image/jpeg",
      size: 1,
      showOnWebsite: false,
      url: "http://m/b",
    },
  ],
};

const errorsOf = (values: GaleriFormValues) => {
  const result = galeriFormSchema.safeParse(values);

  return result.success
    ? {}
    : Object.fromEntries(
        result.error.issues.map((issue) => [
          issue.path.join("."),
          issue.message,
        ]),
      );
};

describe("skema album", () => {
  test("nama dirapikan sebelum diukur: spasi ganda dilebur", () => {
    const result = galeriFormSchema.parse({
      ...VALID,
      name: "  retret   pemuda  ",
    });

    expect(result.name).toBe("Retret Pemuda");
  });

  test("nama 4–100 karakter, badan pelayanan wajib", () => {
    expect(errorsOf({ ...VALID, name: "  ab  " }).name).toBe(
      "Isi nama album, minimal 4 karakter",
    );
    expect(errorsOf({ ...VALID, name: "a".repeat(101) }).name).toBe(
      "Nama album maksimal 100 karakter",
    );
    expect(errorsOf({ ...VALID, bapelId: "" }).bapelId).toBe(
      "Pilih badan pelayanan",
    );
    expect(errorsOf(VALID)).toEqual({});
  });

  test("foto wajib saat tambah dan saat ganti semua foto", () => {
    expect(errorsOf({ ...VALID, listImage: [] }).listImage).toBe(
      "Pilih minimal satu foto",
    );
    expect(
      errorsOf({ ...VALID, isPickingPhotos: false, listImage: [] }),
    ).toEqual({});
  });
});

describe("payload multipart", () => {
  test("showOnWebsite berurutan sesuai berkas, isPublish 1/0", () => {
    const body = toGaleriFormData({
      ...VALID,
      isPublish: "true",
      listImage: [photo("a", true), photo("b"), photo("c", true)],
    });

    expect(body.get("name")).toBe("Retret Pemuda 2026");
    expect(body.get("bapelId")).toBe("2");
    expect(body.get("isPublish")).toBe("1");
    expect(body.getAll("image").map((file) => (file as File).name)).toEqual([
      "a.jpg",
      "b.jpg",
      "c.jpg",
    ]);
    expect(body.getAll("showOnWebsite")).toEqual(["1", "0", "1"]);
    expect(toGaleriFormData(VALID).get("isPublish")).toBe("0");
  });

  test("ubah tanpa ganti foto: tanpa image dan tanpa showOnWebsite", () => {
    const body = toGaleriFormData({
      ...toGaleriForm(ALBUM),
      listImage: [photo("sisa")],
    });

    expect(body.getAll("image")).toEqual([]);
    expect(body.getAll("showOnWebsite")).toEqual([]);
    expect(body.get("isPublish")).toBe("1");
  });
});

describe("pesan server", () => {
  test("duplikat (404/400/409 lama maupun baru) jatuh ke nama", () => {
    for (const message of [
      "Album Sudah Tersedia",
      "Album Tersebut Sudah Tersedia",
    ]) {
      expect(serverFieldError(message)).toEqual({
        field: "name",
        message: "Album dengan nama ini sudah ada. Pakai nama lain.",
      });
    }
  });

  test("multer dan foto jatuh ke field foto; lainnya tingkat form", () => {
    expect(serverFieldError("Unsupported file type")?.field).toBe("listImage");
    expect(serverFieldError("File too large")?.message).toBe(
      "Ukuran berkas maksimal 10 MB",
    );
    expect(serverFieldError("Unexpected field")?.message).toBe(
      "Maksimal 4 foto",
    );
    expect(serverFieldError("Badan Pelayanan Tidak Ditemukan")?.field).toBe(
      "bapelId",
    );
    expect(serverFieldError("Album Tidak Ditemukan")).toBeNull();
  });
});

describe("dua kunci website", () => {
  test("foto tampil hanya bila album terbit dan fotonya dicentang", () => {
    expect(websiteStatusOf(true, ALBUM.listImage)).toBe(
      "1 dari 2 foto tampil di website.",
    );
    expect(websiteStatusOf(false, ALBUM.listImage)).toBe(
      "1 dari 2 foto dicentang, tetapi baru tampil di website sesudah album terbit.",
    );
    expect(websiteStatusOf(true, [ALBUM.listImage[1]])).toBe(
      "Belum ada foto yang dicentang tampil di website.",
    );
    expect(websiteStatusOf(true, [])).toBeNull();
  });

  test("kolom Di website: draf = kosong", () => {
    expect(websiteCellOf(ALBUM)).toBe("1 dari 2");
    expect(websiteCellOf({ ...ALBUM, isPublish: false })).toBeNull();
  });

  test("teks konfirmasi ganti foto menyebut jumlah foto baru", () => {
    expect(replaceDescriptionOf(3)).toBe(
      "Apakah Anda ingin menyimpan perubahan data album ini? Semua foto lama akan diganti dengan 3 foto baru.",
    );
  });
});
