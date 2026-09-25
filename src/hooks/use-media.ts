"use client";

import { useSyncExternalStore } from "react";

export const DESKTOP_MEDIA_QUERY = "(min-width: 64rem)";

export const TABLE_MEDIA_QUERY = "(min-width: 48rem)";

const subscribeTo = (query: string) => (onChange: () => void) => {
  const media = window.matchMedia(query);

  media.addEventListener("change", onChange);

  return () => media.removeEventListener("change", onChange);
};

const subscribeDesktop = subscribeTo(DESKTOP_MEDIA_QUERY);
const getDesktopSnapshot = () => window.matchMedia(DESKTOP_MEDIA_QUERY).matches;

const subscribeTable = subscribeTo(TABLE_MEDIA_QUERY);
const getTableSnapshot = () => window.matchMedia(TABLE_MEDIA_QUERY).matches;

const getServerSnapshot = () => null;

export function useIsDesktop(): boolean | null {
  return useSyncExternalStore(
    subscribeDesktop,
    getDesktopSnapshot,
    getServerSnapshot,
  );
}

export function useIsTableWidth(): boolean | null {
  return useSyncExternalStore(
    subscribeTable,
    getTableSnapshot,
    getServerSnapshot,
  );
}
