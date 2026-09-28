import { describe, expect, test } from "bun:test";

import { FetchError } from "@/lib/api/fetcher";
import type { AttachmentValue } from "@/types/attachment";

import {
  announcementFormSchema,
  emptyAnnouncementForm,
  isOnWebsite,
  periodOf,
  statusPreviewOf,
  toAnnouncementBody,
  toAnnouncementForm,
  toFormError,
  type AnnouncementFormValues,
} from "./model";
import type { Announcement } from "./types";

const TODAY = "2026-09-28";

const VALID: AnnouncementFormValues = {
  ...emptyAnnouncementForm(TODAY),
  title: "Warta Minggu",
  content: "Baris satu\nBaris dua",
};

const messagesOf = (values: AnnouncementFormValues) => {
  const parsed = announcementFormSchema.safeParse(values);

  return parsed.success
    ? {}
    : Object.fromEntries(
        parsed.error.issues.map((issue) => [issue.path[0], issue.message]),
      );
};

const saved = (key: string, showOnWebsite = false): AttachmentValue => ({
  key,
  name: key,
  mimeType: "image/jpeg",
  url: `http://media/${key}`,
  showOnWebsite,
  file: null,
});

const fresh = (name: string, showOnWebsite: boolean): AttachmentValue => ({
  key: name,
  name,
  mimeType: "application/pdf",
  url: `blob:${name}`,
  showOnWebsite,
  file: new File(["x"], name, { type: "application/pdf" }),
});

describe("skema", () => {
  test("bawaan: kategori Pengumuman, terbit hari ini, draf, biasa", () => {
    expect(emptyAnnouncementForm(TODAY)).toMatchObject({
      category: "PENGUMUMAN",
      publishDate: TODAY,
      isPublished: "false",
      isPinned: "false",
    });
    expect(messagesOf(VALID)).toEqual({});
  });

  test("judul di-trim, 4–200 karakter", () => {
    expect(messagesOf({ ...VALID, title: "  abc  " }).title).toBe(
      "Isi judul, minimal 4 karakter",
    );
    expect(messagesOf({ ...VALID, title: "abcd" }).title).toBeUndefined();
    expect(messagesOf({ ...VALID, title: "a".repeat(201) }).title).toBe(
      "Judul maksimal 200 karakter",
    );
  });

  test("isi yang hanya spasi ditolak; kategori dan tanggal terbit wajib", () => {
    expect(
      messagesOf({
        ...VALID,
        content: "  \n ",
        category: "",
        publishDate: "",
      }),
    ).toEqual({
      content: "Isi pengumuman wajib diisi",
      category: "Kategori wajib dipilih",
      publishDate: "Tanggal terbit wajib diisi",
    });
  });

  test("berakhir tidak boleh sebelum terbit; sama boleh", () => {
    expect(
      messagesOf({ ...VALID, publishDate: TODAY, expiryDate: "2026-09-27" })
        .expiryDate,
    ).toBe("Tanggal berakhir tidak boleh sebelum tanggal terbit");
    expect(messagesOf({ ...VALID, expiryDate: TODAY })).toEqual({});
  });

  test("lampiran paling banyak 4", () => {
    expect(
      messagesOf({
        ...VALID,
        listImage: ["a", "b", "c", "d", "e"].map((key) => saved(key)),
      }).listImage,
    ).toBe("Lampiran maksimal 4 berkas");
  });
});

describe("payload multipart", () => {
  test("POST: tanggal berakhir dan badan pelayanan kosong tidak dikirim, boolean 1/0, tanpa keepFiles", () => {
    const body = toAnnouncementBody(
      {
        ...VALID,
        title: "  Warta Minggu ",
        isPublished: "true",
        listImage: [fresh("a.pdf", true), fresh("b.pdf", false)],
      },
      false,
    );

    expect([...body.keys()]).toEqual([
      "title",
      "content",
      "category",
      "publishDate",
      "isPublished",
      "isPinned",
      "image",
      "showOnWebsite",
      "image",
      "showOnWebsite",
    ]);
    expect(body.get("title")).toBe("Warta Minggu");
    expect(body.get("content")).toBe("Baris satu\nBaris dua");
    expect(body.get("isPublished")).toBe("1");
    expect(body.get("isPinned")).toBe("0");
    expect(body.getAll("showOnWebsite")).toEqual(["1", "0"]);
    expect((body.getAll("image") as File[]).map((file) => file.name)).toEqual([
      "a.pdf",
      "b.pdf",
    ]);
  });

  test("PUT: keepFiles selalu dikirim, hanya lampiran lama dengan bendera terbaru", () => {
    const body = toAnnouncementBody(
      {
        ...VALID,
        bapelId: "2",
        expiryDate: "2026-10-04",
        listImage: [saved("p1", true), fresh("c.pdf", false)],
      },
      true,
    );

    expect(body.get("bapelId")).toBe("2");
    expect(body.get("expiryDate")).toBe("2026-10-04");
    expect(JSON.parse(String(body.get("keepFiles")))).toEqual([
      { publicId: "p1", showOnWebsite: true },
    ]);
    expect(body.getAll("image")).toHaveLength(1);

    const cleared = toAnnouncementBody({ ...VALID, listImage: [] }, true);
    expect(cleared.get("keepFiles")).toBe("[]");
  });
});

const ROW: Announcement = {
  publicId: "b1",
  code: "PGM-2026-0002",
  category: "KEGIATAN",
  title: "Retret Pemuda 2026",
  content: "Isi",
  publishDate: "2026-09-26T00:00:00.000Z",
  expiryDate: "2026-10-02T00:00:00.000Z",
  isPublished: true,
  isPinned: false,
  bapel: null,
  listImage: [
    {
      publicId: "p1",
      name: "Poster",
      mimeType: "image/jpeg",
      size: 10,
      showOnWebsite: true,
      url: "http://media/p1",
    },
  ],
  status: "TERBIT",
};

describe("baris ↔ form", () => {
  test("form ubah terisi dari baris, lampiran lama tanpa berkas", () => {
    expect(
      toAnnouncementForm({
        ...ROW,
        bapel: { id: 2, code: "BPL-2", name: "Komisi Pemuda" },
      }),
    ).toMatchObject({
      bapelId: "2",
      publishDate: "2026-09-26",
      expiryDate: "2026-10-02",
      isPublished: "true",
      listImage: [{ key: "p1", showOnWebsite: true, file: null }],
    });
  });

  test("periode dan website", () => {
    expect(periodOf(ROW)).toBe("26 Sep 2026 s.d. 2 Okt 2026");
    expect(periodOf({ ...ROW, expiryDate: null })).toBe("26 Sep 2026");
    expect(isOnWebsite(ROW)).toBe(true);
    expect(isOnWebsite({ ...ROW, status: "TERJADWAL" })).toBe(false);
    expect(isOnWebsite({ ...ROW, category: "BERITA_DUKA" })).toBe(false);
    expect(
      isOnWebsite({ ...ROW, bapel: { id: 2, code: "BPL-2", name: "Komisi" } }),
    ).toBe(false);
  });
});

describe("pratinjau status", () => {
  const base = {
    category: "PENGUMUMAN" as const,
    bapelId: "",
    publishDate: TODAY,
    expiryDate: "",
    isPublished: "true" as const,
  };

  test("terbit seluruh jemaat: aplikasi dan website", () => {
    expect(statusPreviewOf(base, "", TODAY)).toEqual({
      status: "TERBIT",
      timing: "tampil sekarang.",
      reach: "Tampil di aplikasi dan website gereja.",
    });
    expect(
      statusPreviewOf({ ...base, expiryDate: "2026-10-20" }, "", TODAY)?.timing,
    ).toBe("tampil sekarang sampai 20 Okt 2026.");
  });

  test("terjadwal, termasuk berakhir = terbit", () => {
    expect(
      statusPreviewOf({ ...base, publishDate: "2026-10-12" }, "", TODAY),
    ).toMatchObject({
      status: "TERJADWAL",
      timing: "tampil mulai 12 Okt 2026.",
    });
    expect(
      statusPreviewOf(
        { ...base, publishDate: "2026-10-12", expiryDate: "2026-10-12" },
        "",
        TODAY,
      )?.timing,
    ).toBe("tampil 12 Okt 2026 saja.");
  });

  test("komisi, berita duka, ucapan syukur hanya di aplikasi", () => {
    expect(
      statusPreviewOf({ ...base, bapelId: "2" }, "Komisi Pemuda", TODAY)?.reach,
    ).toBe("Hanya tampil di aplikasi: pengumuman untuk Komisi Pemuda.");
    for (const category of ["BERITA_DUKA", "UCAPAN_SYUKUR"] as const) {
      expect(statusPreviewOf({ ...base, category }, "", TODAY)?.reach).toBe(
        "Hanya tampil di aplikasi: berita duka dan ucapan syukur tidak dimuat di website.",
      );
    }
  });

  test("draf dan kedaluwarsa", () => {
    expect(
      statusPreviewOf({ ...base, isPublished: "false" }, "", TODAY),
    ).toEqual({
      status: "DRAF",
      timing: "belum tampil di mana pun.",
      reach: "Bila diterbitkan, tampil di aplikasi dan website gereja.",
    });
    expect(
      statusPreviewOf(
        { ...base, publishDate: "2026-09-01", expiryDate: "2026-09-10" },
        "",
        TODAY,
      ),
    ).toEqual({
      status: "KEDALUWARSA",
      timing: "tanggal berakhir sudah lewat.",
      reach: null,
    });
    expect(statusPreviewOf({ ...base, publishDate: "" }, "", TODAY)).toBeNull();
  });
});

test("galat lampiran server jatuh ke field listImage", () => {
  const mapped = toFormError(
    new FetchError(400, "Lampiran Yang Dipertahankan Tidak Ditemukan", [
      {
        path: "keepFiles",
        message: "Lampiran Yang Dipertahankan Tidak Ditemukan",
      },
      { path: "keepFiles.0.publicId", message: "x" },
      { path: "title", message: "y" },
    ]),
  ) as FetchError;

  expect(mapped.issues.map((issue) => issue.path)).toEqual([
    "listImage",
    "listImage",
    "title",
  ]);
  expect(toFormError("jaringan")).toBe("jaringan");
});
