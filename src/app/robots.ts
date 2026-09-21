import type { MetadataRoute } from "next";

/**
 * SADA adalah aplikasi terautentikasi berisi data jemaat, bukan situs
 * profil. Sekali halaman terautentikasi bocor ke index mesin pencari,
 * penghapusannya bisa memakan waktu berminggu-minggu. Default aman:
 * larang semua crawl. Lihat keputusan D2 di
 * docs/superpowers/specs/2026-08-13-sada-pwa-architecture-design.md.
 *
 * Tidak ada `sitemap:` di sini — sitemap versi SEO sudah dihapus dari repo
 * karena tidak relevan untuk aplikasi yang seluruhnya di-disallow crawl.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    // `/dev` ditulis eksplisit walau sudah tercakup "/": kalau suatu saat
    // "/" dilonggarkan, alat development tetap tidak ikut terindeks.
    rules: { userAgent: "*", disallow: ["/", "/dev"] },
  };
}
