/**
 * `GET /pengumuman/feed` (bentuk sementara, docs/design/kegiatan/README.md §7):
 * Authentication saja, semua pengumuman TERBIT termasuk berita duka, ucapan
 * syukur, dan pengumuman komisi. 200 `[]` bila kosong. Milik TL; terdaftar
 * sebelum `pengumuman.ts` supaya `feed` tidak tertangkap sebagai `:code`.
 */
import { announcementFeed } from "../kegiatan-store";
import { json, paging, type MockHandler } from "../kit";

export const pengumumanFeedMock: MockHandler = (ctx) => {
  if (ctx.path !== "/pengumuman/feed" || ctx.method !== "GET") return null;

  return json({
    status: 200,
    message: "Berhasil Mendapatkan Pengumuman",
    data: process.env.MOCK_EMPTY ? [] : announcementFeed(paging(ctx.url).limit),
  });
};
