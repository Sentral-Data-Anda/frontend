"use client";

import { useServiceWorker } from "@/features/pwa/hooks/use-service-worker";
import { UpdateToast } from "@/features/pwa/ui/update-toast";

export function ServiceWorkerProvider() {
  const { updateReady, applyUpdate } = useServiceWorker();

  if (!updateReady) {
    return null;
  }

  return <UpdateToast onApply={applyUpdate} />;
}
