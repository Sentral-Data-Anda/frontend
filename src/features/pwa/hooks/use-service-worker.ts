"use client";

import { useCallback, useEffect, useRef } from "react";

import {
  serviceWorkerUrl,
  shouldRegisterServiceWorker,
} from "@/features/pwa/model";
import { useBoolean } from "@/hooks/use-boolean";

type ServiceWorkerState = {
  updateReady: boolean;
  applyUpdate: () => void;
};

export function useServiceWorker(): ServiceWorkerState {
  const isUpdateReady = useBoolean(false);
  const { onTrue: markUpdateReady, onFalse: clearUpdateReady } = isUpdateReady;
  const waitingRef = useRef<ServiceWorker | null>(null);

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
    const hadController = !!navigator.serviceWorker.controller;

    const markWaiting = (worker: ServiceWorker | null) => {
      if (cancelled || !worker) {
        return;
      }

      if (!navigator.serviceWorker.controller) {
        return;
      }

      waitingRef.current = worker;
      markUpdateReady();
    };

    const onControllerChange = () => {
      if (reloadingRef.current || (!hadController && !waitingRef.current)) {
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
        updateViaCache: "none",
      })
      .then((registration) => {
        if (cancelled) {
          return;
        }

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
      .catch(() => {});

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
