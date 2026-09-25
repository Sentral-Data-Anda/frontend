"use client";

import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect } from "react";

import { LoadingPage } from "@/components/common/feedback";
import { useBoolean } from "@/hooks/use-boolean";

const HANDOFF_KEY = "sada:auth-handoff";
const HANDOFF_DONE = "sada:auth-handoff-done";
// ponytail: jaring pengaman bila kerangka aplikasi tidak pernah terpasang (galat).
const HANDOFF_TIMEOUT_MS = 8_000;

const isPending = () => {
  try {
    return window.sessionStorage.getItem(HANDOFF_KEY) === "1";
  } catch {
    return false;
  }
};

const clearHandoff = () => {
  try {
    window.sessionStorage.removeItem(HANDOFF_KEY);
  } catch {}
};

export const markAuthHandoff = () => {
  try {
    window.sessionStorage.setItem(HANDOFF_KEY, "1");
  } catch {}
};

export const AuthHandoff = () => {
  const pathname = usePathname();
  const isShown = useBoolean();
  const { onTrue: showCurtain, onFalse: hideCurtain } = isShown;

  useLayoutEffect(() => {
    if (pathname === "/login") {
      clearHandoff();
      hideCurtain();
    } else if (isPending()) {
      showCurtain();
    }
  }, [pathname, showCurtain, hideCurtain]);

  useEffect(() => {
    if (!isShown.value) return;
    if (!isPending()) return hideCurtain();

    const timer = window.setTimeout(hideCurtain, HANDOFF_TIMEOUT_MS);

    window.addEventListener(HANDOFF_DONE, hideCurtain);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(HANDOFF_DONE, hideCurtain);
    };
  }, [isShown.value, hideCurtain]);

  return isShown.value ? <LoadingPage tone="brand" /> : null;
};

export const AuthHandoffDone = () => {
  useEffect(() => {
    clearHandoff();
    window.dispatchEvent(new Event(HANDOFF_DONE));
  }, []);

  return null;
};
