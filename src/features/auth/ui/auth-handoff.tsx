"use client";

import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect } from "react";

import { LoadingPage } from "@/components/common/feedback";
import { useBoolean } from "@/hooks/use-boolean";

const HANDOFF_KEY = "sada:auth-handoff";
const HANDOFF_DONE = "sada:auth-handoff-done";

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

// Tirai tetap selama loading root (layar putih) masih tampil sesudah /authentication.
const isRouteLoading = () => !!document.querySelector("[data-loading-page]");

export const AuthHandoff = () => {
  const pathname = usePathname();
  const isShown = useBoolean();
  const { onTrue: showCurtain, onFalse: hideCurtain } = isShown;

  useLayoutEffect(() => {
    const isAuthenticating = pathname === "/authentication";
    let observer: MutationObserver | null = null;

    const sync = () => {
      if (isPending() && (isAuthenticating || isRouteLoading())) {
        showCurtain();
        return;
      }

      if (!isAuthenticating) clearHandoff();
      observer?.disconnect();
      hideCurtain();
    };

    sync();

    if (isAuthenticating || !isPending()) return;

    observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer?.disconnect();
  }, [pathname, showCurtain, hideCurtain]);

  useEffect(() => {
    if (!isShown.value) return;
    if (!isPending()) return hideCurtain();

    window.addEventListener(HANDOFF_DONE, hideCurtain);

    return () => window.removeEventListener(HANDOFF_DONE, hideCurtain);
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
