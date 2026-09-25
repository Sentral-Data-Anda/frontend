"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

import { isIOS, isStandalone } from "../model";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type InstallPromptState = {
  isPromptAvailable: boolean;
  isManualGuideNeeded: boolean;
  installed: boolean;
  promptInstall: () => Promise<void>;
};

function subscribeInstalled(onChange: () => void) {
  const media = window.matchMedia("(display-mode: standalone)");

  media.addEventListener("change", onChange);
  window.addEventListener("appinstalled", onChange);

  return () => {
    media.removeEventListener("change", onChange);
    window.removeEventListener("appinstalled", onChange);
  };
}

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

  const promptInstall = useCallback(async () => {
    if (!deferred) {
      return;
    }

    await deferred.prompt();
    await deferred.userChoice;

    setDeferred(null);
  }, [deferred]);

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
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

  return {
    isPromptAvailable: deferred !== null && !installed,
    isManualGuideNeeded: ios && !installed,
    installed,
    promptInstall,
  };
}
