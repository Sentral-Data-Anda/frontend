"use client";

import { UpdateToast } from "@/features/pwa/components/update-toast";
import { useServiceWorker } from "@/features/pwa/hooks/use-service-worker";

/**
 * Titik pasang service worker. Dipasang sekali di root layout.
 *
 * Tidak merender apa pun sampai ada versi baru yang menunggu, jadi aman
 * diletakkan di dalam `<body>` tanpa mengganggu tata letak.
 */
export function ServiceWorkerProvider() {
  const { updateReady, applyUpdate } = useServiceWorker();

  if (!updateReady) {
    return null;
  }

  return <UpdateToast onApply={applyUpdate} />;
}
