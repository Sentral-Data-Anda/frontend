"use client";

import { useSyncExternalStore } from "react";

/**
 * Batas desktop. SAMA dengan `--breakpoint-lg` Tailwind (64rem), yang dipakai
 * shell (`lg:hidden`, `hidden lg:flex`) dan token `--font-size-title` di
 * globals.css. JS tidak bisa membaca theme Tailwind, jadi kesamaannya dijaga
 * `use-is-desktop.test.ts` — bukan komentar ini.
 */
export const DESKTOP_MEDIA_QUERY = "(min-width: 64rem)";

const subscribe = (onChange: () => void) => {
  const media = window.matchMedia(DESKTOP_MEDIA_QUERY);

  media.addEventListener("change", onChange);

  return () => media.removeEventListener("change", onChange);
};

const getSnapshot = () => window.matchMedia(DESKTOP_MEDIA_QUERY).matches;

/** Server tidak tahu lebar layar. */
const getServerSnapshot = () => null;

/**
 * `true` desktop, `false` mobile/tablet, `null` BELUM DIKETAHUI.
 *
 * `null` itu yang membuat hidrasi aman: saat hidrasi React memakai snapshot
 * server, jadi render pertama identik dengan HTML server; satu render sesudahnya
 * nilai sungguhan masuk. Pemakai data (`useListQuery`) menunggu `null` lewat
 * sebelum mengambil apa pun — kalau `null` dianggap "mobile", desktop akan
 * mengambil halaman 1 versi infinite lalu membuangnya demi `?page=`.
 *
 * Saat navigasi sisi klien (bukan hidrasi) snapshot klien langsung dipakai,
 * jadi tidak ada render `null` sama sekali.
 *
 * Hanya untuk perbedaan PERILAKU. Perbedaan tampilan tetap `lg:` di
 * `components/layout`, yang tidak butuh JS dan tidak berkedip.
 */
export function useIsDesktop(): boolean | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
