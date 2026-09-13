"use client";

import { useCallback, useEffect, useRef } from "react";

import {
  serviceWorkerUrl,
  shouldRegisterServiceWorker,
} from "@/features/pwa/lib/register";
import { useBoolean } from "@/hooks/use-boolean";

type ServiceWorkerState = {
  /** Ada versi baru yang sudah terpasang dan menunggu persetujuan user. */
  updateReady: boolean;
  /** Setujui update: service worker baru mengambil alih, lalu halaman dimuat ulang. */
  applyUpdate: () => void;
};

/**
 * Mendaftarkan service worker dan mendeteksi kapan versi baru siap.
 *
 * Alur update sengaja meminta persetujuan user, bukan otomatis:
 *
 *   1. Service worker baru selesai `install` dan berhenti di `waiting`
 *   2. Hook ini mendeteksinya dan menyalakan `updateReady`
 *   3. User mengklik toast, `applyUpdate()` mengirim pesan `SKIP_WAITING`
 *   4. Service worker memanggil `skipWaiting()` dan mengambil alih
 *   5. Event `controllerchange` memicu satu kali `location.reload()`
 *
 * Syarat pada langkah 2 — `navigator.serviceWorker.controller` harus sudah
 * ada — yang membedakan "ada update" dari "instalasi pertama". Pada instalasi
 * pertama belum ada controller, dan menampilkan toast "versi baru tersedia"
 * di situ akan membingungkan: tidak ada versi lama yang digantikan.
 */
export function useServiceWorker(): ServiceWorkerState {
  const isUpdateReady = useBoolean(false);
  // `onTrue`/`onFalse` ditarik keluar (bukan dipakai lewat `isUpdateReady.onTrue`
  // langsung) supaya bisa dicantumkan di dependency array useEffect/useCallback
  // di bawah tanpa memicu warning react-hooks/exhaustive-deps. Keduanya stabil
  // antar-render (dibungkus useCallback di useBoolean), jadi mencantumkannya
  // tidak membuat efek berjalan ulang.
  const { onTrue: markUpdateReady, onFalse: clearUpdateReady } = isUpdateReady;
  const waitingRef = useRef<ServiceWorker | null>(null);

  // Penjaga loop reload. Tanpa ini, `controllerchange` yang menyala lebih dari
  // sekali (mis. dua tab sekaligus) bisa membuat halaman memuat ulang terus.
  const reloadingRef = useRef(false);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      !shouldRegisterServiceWorker()
    ) {
      return;
    }

    let cancelled = false;

    const markWaiting = (worker: ServiceWorker | null) => {
      if (cancelled || !worker) {
        return;
      }

      // Hanya update kalau sudah ada controller — kalau belum, ini instalasi
      // pertama, bukan pergantian versi.
      if (!navigator.serviceWorker.controller) {
        return;
      }

      waitingRef.current = worker;
      markUpdateReady();
    };

    const onControllerChange = () => {
      if (reloadingRef.current) {
        return;
      }
      reloadingRef.current = true;
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener(
      "controllerchange",
      onControllerChange,
    );

    navigator.serviceWorker
      .register(serviceWorkerUrl(), {
        scope: "/",
        // Jangan pernah menyajikan skrip service worker dari HTTP cache.
        // Digandeng dengan header `Cache-Control: no-store` pada /sw.js di
        // next.config.ts — keduanya mencegah service worker basi nyangkut.
        updateViaCache: "none",
      })
      .then((registration) => {
        if (cancelled) {
          return;
        }

        // Versi baru sudah menunggu sejak sebelum halaman ini dibuka.
        markWaiting(registration.waiting);

        registration.addEventListener("updatefound", () => {
          const installing = registration.installing;
          if (!installing) {
            return;
          }

          installing.addEventListener("statechange", () => {
            if (installing.state === "installed") {
              markWaiting(installing);
            }
          });
        });
      })
      .catch(() => {
        // Registrasi gagal (mis. /sw.js dialihkan ke /login karena proxy auth
        // belum mengecualikannya). Aplikasi tetap berfungsi penuh tanpa
        // service worker, jadi kegagalan ini tidak boleh merusak halaman.
      });

    return () => {
      cancelled = true;
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange,
      );
    };
  }, [markUpdateReady]);

  const applyUpdate = useCallback(() => {
    const waiting = waitingRef.current;
    if (!waiting) {
      return;
    }

    clearUpdateReady();
    waiting.postMessage({ type: "SKIP_WAITING" });
  }, [clearUpdateReady]);

  return { updateReady: isUpdateReady.value, applyUpdate };
}
