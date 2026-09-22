"use client";

import { useSyncExternalStore } from "react";

import { readListReturn } from "@/lib/list-return";

const subscribe = () => () => {};

/**
 * `backHref` layar detail: URL daftar terakhir di tab ini, atau daftar bersih
 * (docs/design/list-state.md §2.2, L-3). JANGAN `router.back()` — layar detail
 * bisa dibuka dari notifikasi atau tautan yang dibagikan.
 *
 * `useSyncExternalStore`: `sessionStorage` tidak ada di server, jadi render
 * server dan hidrasi memakai `listPath` bersih, lalu klien menggantinya.
 */
export const useListReturn = (listPath: string): string =>
  useSyncExternalStore(
    subscribe,
    () => readListReturn(listPath),
    () => listPath,
  );
