/**
 * `GET /pengumuman/feed` (03-api-contract Kegiatan): Authentication saja, semua
 * pengumuman TERBIT termasuk berita duka, ucapan syukur, dan pengumuman komisi;
 * berhalaman, 200 `data: []` bila kosong. Milik TL; terdaftar
 * sebelum `pengumuman.ts` supaya `feed` tidak tertangkap sebagai `:code`.
 */
import { announcementFeed, visibleAnnouncementCount } from "../kegiatan-store";
import { json, paging, type MockHandler } from "../kit";

export const pengumumanFeedMock: MockHandler = (ctx) => {
  if (ctx.path !== "/pengumuman/feed" || ctx.method !== "GET") return null;

  const { page, limit } = paging(ctx.url);
  const totalData = process.env.MOCK_EMPTY ? 0 : visibleAnnouncementCount();

  return json({
    status: 200,
    message: "Berhasil Mendapatkan Pengumuman",
    totalData,
    totalPage: Math.ceil(totalData / limit),
    data: totalData === 0 ? [] : announcementFeed(limit, page),
  });
};
