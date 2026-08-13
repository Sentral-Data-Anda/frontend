/**
 * Identitas situs dipusatkan di sini agar tidak hardcode bertebaran.
 * SITE_URL dipakai untuk metadata/sitemap (server-side); fallback ke domain produksi.
 */
export const siteConfig = {
  name: "GKI Graha Raya",
  shortName: "GKI Graha Raya",
  description:
    "Gereja Kristen Indonesia Graha Raya — profil, jadwal ibadah, berita, dan kegiatan pelayanan jemaat.",
  url: process.env.SITE_URL ?? "https://gkigraharaya.org",
  ogImage: "/og-image.png",
  contact: {
    address: "Jl. Contoh Alamat No. 1, Graha Raya, Tangerang",
    phone: "+62 21 0000 0000",
    email: "sekretariat@gkigraharaya.org",
    mapsUrl: "https://maps.google.com/?q=GKI+Graha+Raya",
  },
  links: {
    instagram: "https://instagram.com/gkigraharaya",
    youtube: "https://youtube.com/@gkigraharaya",
    facebook: "https://facebook.com/gkigraharaya",
  },
} as const;

export type SiteConfig = typeof siteConfig;
