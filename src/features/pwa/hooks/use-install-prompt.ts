"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

import { isIOS, isStandalone } from "@/features/pwa/model";

/**
 * Event `beforeinstallprompt` belum masuk lib DOM TypeScript karena statusnya
 * masih non-standar (hanya Chromium). Bentuknya dideklarasikan di sini
 * seperlunya, bukan dengan `any`.
 */
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type InstallPromptState = {
  /** Instalasi otomatis bisa dipicu sekarang (Chromium desktop & Android). */
  canPrompt: boolean;
  /** Perangkat butuh panduan manual — Safari iOS tidak punya prompt otomatis. */
  needsManualGuide: boolean;
  /** Aplikasi sudah terpasang dan sedang berjalan sebagai PWA. */
  installed: boolean;
  /** Munculkan dialog instalasi bawaan browser. */
  promptInstall: () => Promise<void>;
};

/**
 * Menangkap event instalasi dan menyeragamkan perbedaan antar platform.
 *
 * Tiga jalur berbeda yang harus dibedakan UI:
 * - Chromium (desktop & Android): `beforeinstallprompt` tersedia, tombol
 *   instalasi bisa memunculkan dialog asli
 * - Safari iOS: tidak ada event maupun API. Hanya panduan manual yang mungkin
 * - Sudah terpasang: tidak perlu menawarkan apa pun
 */
/**
 * Nilai-nilai ini berasal dari platform, bukan dari state React, jadi dibaca
 * lewat `useSyncExternalStore` alih-alih `useState` + `useEffect`.
 *
 * Bukan sekadar soal gaya: membaca `window` lalu `setState` di dalam efek
 * memicu render bertingkat dan ditolak aturan `react-hooks/set-state-in-effect`.
 * `useSyncExternalStore` juga menangani hidrasi dengan benar — snapshot server
 * selalu `false`, dan React menyelaraskannya setelah hidrasi tanpa peringatan
 * ketidakcocokan.
 */
function subscribeInstalled(onChange: () => void) {
  const media = window.matchMedia("(display-mode: standalone)");

  media.addEventListener("change", onChange);
  window.addEventListener("appinstalled", onChange);

  return () => {
    media.removeEventListener("change", onChange);
    window.removeEventListener("appinstalled", onChange);
  };
}

/** Platform perangkat tidak pernah berubah selama halaman hidup. */
function subscribeNever() {
  return () => {};
}

const serverFalse = () => false;

export function useInstallPrompt(): InstallPromptState {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );

  const installed = useSyncExternalStore(
    subscribeInstalled,
    isStandalone,
    serverFalse,
  );
  const ios = useSyncExternalStore(subscribeNever, isIOS, serverFalse);

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      // Cegah mini-infobar Chrome supaya prompt-nya muncul pada saat yang kita
      // pilih — yaitu setelah user menekan tombol — bukan tiba-tiba saat load.
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };

    const onAppInstalled = () => setDeferred(null);

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferred) {
      return;
    }

    await deferred.prompt();
    await deferred.userChoice;

    // Event ini sekali pakai — dibuang apa pun pilihan user. Browser akan
    // mengirimkannya lagi bila masih menganggap aplikasi layak dipasang.
    setDeferred(null);
  }, [deferred]);

  return {
    canPrompt: deferred !== null && !installed,
    // Safari iOS tidak pernah mengirim `beforeinstallprompt`, jadi di sana
    // panduan manual adalah satu-satunya jalur — bukan fallback.
    needsManualGuide: ios && !installed,
    installed,
    promptInstall,
  };
}
