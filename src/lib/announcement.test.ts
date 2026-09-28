import { describe, expect, test } from "bun:test";

import {
  announcementStatusOf,
  categoryLabelOf,
  isWebsiteAnnouncement,
} from "./announcement";

const TODAY = "2026-09-28";

const status = (
  isPublished: boolean,
  publishDate: string,
  expiryDate: string | null = null,
) => announcementStatusOf({ isPublished, publishDate, expiryDate }, TODAY);

describe("announcementStatusOf", () => {
  test("belum disetujui tetap draf walau tanggalnya lewat", () => {
    expect(status(false, "2026-01-01")).toBe("DRAF");
  });

  test("tanggal terbit besok = terjadwal, hari ini = terbit", () => {
    expect(status(true, "2026-09-29")).toBe("TERJADWAL");
    expect(status(true, "2026-09-28")).toBe("TERBIT");
  });

  test("tanggal berakhir adalah hari terakhir tayang", () => {
    expect(status(true, "2026-09-20", "2026-09-28")).toBe("TERBIT");
    expect(status(true, "2026-09-20", "2026-09-27")).toBe("KEDALUWARSA");
  });

  test("terjadwal diperiksa sebelum kedaluwarsa", () => {
    expect(status(true, "2026-10-01", "2026-09-01")).toBe("TERJADWAL");
  });

  test("menerima ISO tengah malam UTC dari kolom @db.Date", () => {
    expect(status(true, "2026-09-28T00:00:00.000Z")).toBe("TERBIT");
  });
});

describe("isWebsiteAnnouncement", () => {
  test("hanya pengumuman seluruh jemaat", () => {
    expect(
      isWebsiteAnnouncement({ category: "WARTA", isChurchWide: true }),
    ).toBe(true);
    expect(
      isWebsiteAnnouncement({ category: "WARTA", isChurchWide: false }),
    ).toBe(false);
  });

  test("berita duka dan ucapan syukur tidak pernah ke website", () => {
    expect(
      isWebsiteAnnouncement({ category: "BERITA_DUKA", isChurchWide: true }),
    ).toBe(false);
    expect(
      isWebsiteAnnouncement({ category: "UCAPAN_SYUKUR", isChurchWide: true }),
    ).toBe(false);
  });
});

test("label kategori tak dikenal jatuh ke nilainya", () => {
  expect(categoryLabelOf("BERITA_DUKA")).toBe("Berita duka");
  expect(categoryLabelOf("LAIN")).toBe("LAIN");
});
