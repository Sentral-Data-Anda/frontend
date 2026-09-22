/**
 * Pilihan "sidebar ringkas" (rail ikon) di desktop. Cookie, bukan
 * localStorage: `AppShell` (server) membacanya supaya render pertama sudah
 * selebar pilihan user — tanpa kedipan dan tanpa hydration mismatch.
 *
 * Berkas terpisah tanpa `"use client"`: server dan sidebar sama-sama
 * memakainya, dan fungsi dari modul client tidak bisa dipanggil di server.
 */
export const SIDEBAR_COOKIE = "sidebar_collapsed";

export const isSidebarCollapsed = (value: string | undefined): boolean =>
  value === "1";

export const sidebarCookie = (isCollapsed: boolean): string =>
  `${SIDEBAR_COOKIE}=${isCollapsed ? "1" : "0"}; Path=/; Max-Age=31536000; SameSite=Lax`;

/**
 * Satu kurva untuk seluruh gerak ciut/lebar — lebar aside, label memudar,
 * sub-layar mengempis — supaya bergerak sebagai satu gerakan. Kurva
 * "emphasized decelerate": cepat di awal (terasa responsif), halus di akhir.
 */
export const SIDEBAR_MOTION =
  "duration-200 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none";
