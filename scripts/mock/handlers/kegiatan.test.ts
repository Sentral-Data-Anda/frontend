import { afterEach, describe, expect, test } from "bun:test";

import { MENU, type MenuSlug } from "../../../src/config/menu";
import {
  announcementFeed,
  EVENT,
  eventView,
  holdersOf,
  publicAnnouncements,
  TODAY,
} from "../kegiatan-store";
import { multerRejection } from "../media";

import { kegiatanMock } from "./kegiatan";
import { pengumumanFeedMock } from "./pengumuman-feed";

const call = async (
  path: string,
  grants: MenuSlug[] = [MENU.EVENT],
  handler = kegiatanMock,
) => {
  const url = new URL(path, "http://mock.test");
  const response = await handler({
    request: new Request(url),
    url,
    path: url.pathname,
    method: "GET",
    can: (slug) => grants.includes(slug),
    isAdmin: false,
    sessionCode: "test",
  });

  return response!;
};

afterEach(() => {
  delete process.env.MOCK_MEDIA_EXPIRED;
});

describe("seed Kegiatan", () => {
  test("Latihan Paduan Suara penuh, Retret menahan kursi menunggu bayar", () => {
    expect(holdersOf(3)).toBe(3);
    expect(holdersOf(2)).toBe(3);
  });

  test("setiap event punya foto; Bazar Natal menunjuk berkas hilang", async () => {
    for (const row of EVENT) expect(eventView(row).image).not.toBeNull();

    const bazar = eventView(EVENT[3]).image!;
    const response = await call(new URL(bazar.url).pathname);

    expect(response.status).toBe(404);
  });
});

describe("GET /ddl/event", () => {
  test("pemegang Pendaftaran tanpa Event boleh; tanpa keduanya 403", async () => {
    expect((await call("/ddl/event", [MENU.PENDAFTARAN_EVENT])).status).toBe(
      200,
    );
    expect((await call("/ddl/event", [])).status).toBe(403);
  });

  test("isOpen=1: terbit dan belum mulai, urut tanggal naik, penuh ditandai", async () => {
    const body = await (await call("/ddl/event?isOpen=1")).json();
    const names = body.data.map((row: { name: string }) => row.name);

    expect(names).not.toContain("Seminar Keluarga Kristen");
    expect(names).not.toContain("Donor Darah");
    expect(names).not.toContain("Sekolah Minggu Kreatif");
    expect(names[0]).toBe("Rapat Majelis");
    expect(
      body.data.find(
        (row: { name: string }) => row.name === "Latihan Paduan Suara",
      ),
    ).toMatchObject({ isFull: true, registeredCount: 3, capacity: 3 });
  });
});

describe("GET /event (cadangan Beranda)", () => {
  test("rentang bersinggungan: event yang sedang berlangsung ikut", async () => {
    const body = await (
      await call(`/event?startDate=${TODAY}&endDate=${TODAY}&isPublish=1`)
    ).json();

    expect(body.data.map((row: { name: string }) => row.name)).toEqual([
      "Sekolah Minggu Kreatif",
    ]);
  });

  test("isPublish=1 membuang draf", async () => {
    const body = await (await call("/event?isPublish=1&limit=100")).json();

    expect(
      body.data.some((row: { isPublish: boolean }) => !row.isPublish),
    ).toBe(false);
  });

  test("tanpa EVENT: 403", async () => {
    expect((await call("/event", [])).status).toBe(403);
  });
});

describe("pengumuman", () => {
  test("feed: empat teratas = empat baris widget Beranda lama", () => {
    expect(announcementFeed(4).map((row) => row.title)).toEqual([
      "Warta Jemaat Minggu Ini",
      "Retret Pemuda 2026",
      "Perubahan jam Ibadah Minggu II",
      "Ucapan syukur Keluarga Manurung",
    ]);
  });

  test("feed memuat berita duka dan pengumuman komisi, bukan draf/terjadwal", () => {
    const titles = announcementFeed(100).map((row) => row.title);

    expect(titles).toContain("Berita duka: Bpk. Gideon Tampubolon");
    expect(titles).toContain("Rapat pengurus Komisi Pemuda");
    expect(titles).not.toContain("Pendaftaran katekisasi dibuka");
    expect(titles).not.toContain("Jadwal ibadah Natal 2026");
    expect(titles).not.toContain("Ibadah Paskah 2026");
  });

  test("website: hanya seluruh jemaat, tanpa duka/syukur, lampiran website saja", () => {
    const rows = publicAnnouncements(100);

    expect(rows.map((row) => row.title)).toEqual([
      "Warta Jemaat Minggu Ini",
      "Retret Pemuda 2026",
      "Perubahan jam Ibadah Minggu II",
    ]);
    expect(rows[0].files).toEqual([]);
    expect(rows[1].files.map((file) => file.name)).toEqual(["Poster Retret"]);
  });

  test("GET /pengumuman/feed tanpa izin menu", async () => {
    const body = await (
      await call("/pengumuman/feed?limit=2", [], pengumumanFeedMock)
    ).json();

    expect(body.data).toHaveLength(2);
  });
});

describe("media", () => {
  test("MOCK_MEDIA_EXPIRED: 403", async () => {
    const photo = eventView(EVENT[0]).image!;

    expect((await call(new URL(photo.url).pathname)).status).toBe(200);
    process.env.MOCK_MEDIA_EXPIRED = "1";
    expect((await call(new URL(photo.url).pathname)).status).toBe(403);
  });

  test("multer: tipe, ukuran, jumlah per field", async () => {
    const status = (files: { field: string; type?: string; size?: number }[]) =>
      multerRejection(
        files.map((file) => ({
          field: file.field,
          type: file.type ?? "image/jpeg",
          size: file.size ?? 10,
        })),
      )?.status ?? 200;

    expect(status([{ field: "image", type: "image/gif" }])).toBe(415);
    expect(status([{ field: "mainImage", size: 10_000_001 }])).toBe(400);
    expect(status([{ field: "mainImage", size: 10_000_000 }])).toBe(200);
    expect(status([{ field: "mainImage" }, { field: "mainImage" }])).toBe(400);
    expect(status([{ field: "document" }])).toBe(400);
    expect(
      status([
        { field: "image" },
        { field: "image" },
        { field: "image" },
        { field: "image" },
        { field: "mainImage" },
      ]),
    ).toBe(200);
    expect(
      await multerRejection([
        { field: "image", type: "text/plain", size: 1 },
      ])!.json(),
    ).toEqual({ status: 415, error: "Unsupported file type" });
  });
});
