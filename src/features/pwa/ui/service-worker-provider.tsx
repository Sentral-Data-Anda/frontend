"use client";

import { useServiceWorker } from "../hooks/use-service-worker";

import { UpdateToast } from "./update-toast";

export const ServiceWorkerProvider = () => {
  const { updateReady, applyUpdate } = useServiceWorker();

  if (!updateReady) {
    return null;
  }

  return <UpdateToast onApply={applyUpdate} />;
};
