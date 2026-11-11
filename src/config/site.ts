import { appTimezoneSchema } from "../lib/env-schema";

export const siteConfig = {
  name: "Sentral Data Anda",
  shortName: "SADA",
  description:
    "Sentral Data Anda (SADA) — aplikasi pengelolaan data dan pelayanan jemaat GKI Graha Raya.",
} as const;

export type SiteConfig = typeof siteConfig;

// Dibaca sendiri, bukan lewat lib/env: modul itu juga mewajibkan VITE_SITE_URL,
// sedangkan zona waktu dipakai di mana-mana termasuk saat test.
export const APP_TIMEZONE = appTimezoneSchema.parse(
  import.meta.env.VITE_APP_TIMEZONE,
);

export const SITE_TITLE = `${siteConfig.name} (${siteConfig.shortName})`;

/** Judul tab untuk satu halaman, mis. "Daftar Jemaat · SADA". */
export const withSiteName = (title: string): string =>
  `${title} · ${siteConfig.shortName}`;
