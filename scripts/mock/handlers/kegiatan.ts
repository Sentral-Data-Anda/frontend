/**
 * Bagian bersama grup Kegiatan milik TL (docs/design/kegiatan/README.md §4a):
 * berkas `/media/*`, `GET /ddl/event` (bentuk sesudah B3), dan cadangan
 * `GET /event` + `GET /public/announcement` dari `kegiatan-store.ts` untuk
 * Beranda. Terdaftar SESUDAH handler fitur, jadi `event.ts` (F1) yang menjawab
 * `/event` begitu ada; cadangan ini dibuang pasca-merge F1.
 *
 *   MOCK_DDL_EMPTY=1 → `/ddl/event` 404
 */
import { MENU } from "../../../src/config/menu";
import {
  EVENT,
  holdersOf,
  isLive,
  listEvents,
  publicAnnouncements,
  TODAY,
} from "../kegiatan-store";
import { denied, json, list, paging, type MockHandler } from "../kit";
import { serveMedia } from "../media";

export const ddlEvents = (url: URL) => {
  const isOpenOnly = url.searchParams.get("isOpen") === "1";

  return EVENT.filter(isLive)
    .map((row) => {
      const registeredCount = holdersOf(row.id);

      return {
        row,
        registeredCount,
        isOpen:
          row.isPublish &&
          row.startDate >= TODAY &&
          registeredCount < row.capacity,
      };
    })
    .filter((item) => !isOpenOnly || item.isOpen)
    .sort((a, b) =>
      isOpenOnly
        ? a.row.startDate.localeCompare(b.row.startDate)
        : b.row.startDate.localeCompare(a.row.startDate),
    )
    .map(({ row, isOpen, registeredCount }) => ({
      id: row.id,
      code: row.code,
      name: row.name,
      startDate: `${row.startDate}T00:00:00.000Z`,
      endDate: `${row.endDate}T00:00:00.000Z`,
      startTime: row.startTime,
      endTime: row.endTime,
      capacity: row.capacity,
      registeredCount,
      isPaid: row.isPaid,
      price: row.price,
      isOpen,
    }));
};

export const kegiatanMock: MockHandler = (ctx) => {
  const media = serveMedia(ctx.path);
  if (media) return media;

  if (ctx.method !== "GET") return null;

  if (ctx.path === "/ddl/event") {
    if (
      !ctx.can(MENU.PENDAFTARAN_EVENT, "VIEW") &&
      !ctx.can(MENU.EVENT, "VIEW")
    ) {
      return denied();
    }

    const rows = process.env.MOCK_DDL_EMPTY ? [] : ddlEvents(ctx.url);

    return rows.length === 0
      ? json({ status: 404, error: "Event Tidak Ditemukan" }, 404)
      : json({
          status: 200,
          message: "Berhasil Mendapatkan Semua Event",
          data: rows,
        });
  }

  if (ctx.path === "/event") {
    if (!ctx.can(MENU.EVENT, "VIEW")) return denied();

    return list(listEvents(ctx.url.searchParams), ctx.url, "Event", "Event");
  }

  if (ctx.path === "/public/announcement") {
    return json({
      status: 200,
      message: "Berhasil Mendapatkan Pengumuman",
      data: publicAnnouncements(paging(ctx.url).limit),
    });
  }

  return null;
};
