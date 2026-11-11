export const siteConfig = {
  name: "Sentral Data Anda",
  shortName: "SADA",
  description:
    "Sentral Data Anda (SADA) — aplikasi pengelolaan data dan pelayanan jemaat GKI Graha Raya.",
} as const;

export type SiteConfig = typeof siteConfig;

export const APP_TIMEZONE = "Asia/Jakarta";

export const SITE_TITLE = `${siteConfig.name} (${siteConfig.shortName})`;

/** Judul tab untuk satu halaman, mis. "Daftar Jemaat · SADA". */
export const withSiteName = (title: string): string =>
  `${title} · ${siteConfig.shortName}`;
