"use client";

import { useEffect, useRef } from "react";

import { useBoolean } from "./use-boolean";

/**
 * Jendela tampil layar tunggu (keputusan user 2026-09-23: "bisa diperlama
 * sedikit … tapi tidak bikin kesel").
 *
 * - `delayMs`: tunggu yang selesai lebih cepat dari ini TIDAK menampilkan apa
 *   pun — tidak ada kedipan, dan tidak ada waktu yang ditambahkan.
 * - `minVisibleMs`: begitu tampil, bertahan minimal selama ini walau datanya
 *   sudah tiba, supaya animasinya sempat utuh.
 *
 * Hanya berguna bagi pemanggil yang MEMILIKI keadaan menunggunya. Fallback
 * `loading.tsx` dicabut Next begitu kerja server selesai, jadi di sana yang
 * berlaku hanya `delayMs` (lihat `LoadingPage`), dan penahannya dipasang di
 * kerja server layar itu — lihat `(auth)/authentication/page.tsx`.
 */
export function useLoadingWindow(
  isLoading: boolean,
  {
    delayMs = 150,
    minVisibleMs = 800,
  }: { delayMs?: number; minVisibleMs?: number } = {},
): boolean {
  const isShown = useBoolean();
  const shownAtRef = useRef(0);
  const { value, onTrue, onFalse } = isShown;

  useEffect(() => {
    if (isLoading === value) return;

    // Selalu lewat timer, tidak pernah `setState` sinkron di dalam efek:
    // sisa 0 pun dijadwalkan (0ms) supaya rendernya satu putaran sendiri.
    const timer = setTimeout(
      () => {
        if (isLoading) {
          shownAtRef.current = Date.now();
          onTrue();
          return;
        }
        onFalse();
      },
      isLoading
        ? delayMs
        : Math.max(0, minVisibleMs - (Date.now() - shownAtRef.current)),
    );

    return () => clearTimeout(timer);
  }, [isLoading, value, onTrue, onFalse, delayMs, minVisibleMs]);

  return value;
}
