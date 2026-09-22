"use client";

import { useSyncExternalStore } from "react";

let clientNow: Date | null = null;

const subscribe = () => () => {};

/**
 * "Sekarang" yang aman untuk hidrasi (dashboard-desktop.md §5.6): `null` di
 * server DAN saat hidrasi, lalu satu `Date` yang sama untuk seluruh halaman
 * di klien. Teks bertanggal yang dirender tanpa menunggu query memakai ini;
 * tanpanya render server dan klien bisa jatuh di dua sisi pergantian
 * jam/hari dan React membuang pohonnya ("Hydration failed").
 *
 * ponytail: dibekukan sampai halaman dimuat ulang — halaman yang dibiarkan
 * terbuka melewati tengah malam tetap menampilkan hari kemarin.
 */
export const useNow = (): Date | null =>
  useSyncExternalStore(
    subscribe,
    () => (clientNow ??= new Date()),
    () => null,
  );
