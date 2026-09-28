import { describe, expect, test } from "bun:test";

import {
  fromServerAttachment,
  keptAttachments,
  newAttachments,
  rejectionOf,
} from "./attachment";

const file = (name: string, type: string, size = 10) =>
  new File([new Uint8Array(size)], name, { type });

describe("rejectionOf", () => {
  test("JPG dan PNG diterima", () => {
    expect(rejectionOf(file("a.jpg", "image/jpeg"), "image")).toBeNull();
    expect(rejectionOf(file("a.png", "image/png"), "image")).toBeNull();
  });

  test("PDF hanya untuk image-pdf", () => {
    const pdf = file("warta.pdf", "application/pdf");

    expect(rejectionOf(pdf, "image")).toBe("Pilih berkas JPG atau PNG");
    expect(rejectionOf(pdf, "image-pdf")).toBeNull();
  });

  test("HEIC ditolak dengan saran, walau tipe MIME kosong", () => {
    expect(rejectionOf(file("IMG_0001.HEIC", ""), "image")).toContain("HEIC");
  });

  test("lebih dari 10 MB ditolak, tepat 10 MB diterima", () => {
    expect(rejectionOf(file("a.jpg", "image/jpeg", 10_000_001), "image")).toBe(
      "Ukuran berkas maksimal 10 MB",
    );
    expect(
      rejectionOf(file("a.jpg", "image/jpeg", 10_000_000), "image"),
    ).toBeNull();
  });
});

describe("lampiran lama dan baru", () => {
  const server = fromServerAttachment({
    publicId: "p-1",
    name: "poster",
    mimeType: "image/jpeg",
    size: 100,
    showOnWebsite: true,
    url: "http://media/p-1",
  });
  const fresh = {
    key: "n-1",
    name: "baru.jpg",
    mimeType: "image/jpeg",
    url: "blob:x",
    showOnWebsite: false,
    file: file("baru.jpg", "image/jpeg"),
  };

  test("berkas lama berkunci publicId tanpa File", () => {
    expect(server).toMatchObject({ key: "p-1", file: null });
  });

  test("dipisah menjadi keepFiles dan berkas baru", () => {
    expect(keptAttachments([server, fresh])).toEqual([
      { publicId: "p-1", showOnWebsite: true },
    ]);
    expect(newAttachments([server, fresh]).map((item) => item.key)).toEqual([
      "n-1",
    ]);
  });
});
