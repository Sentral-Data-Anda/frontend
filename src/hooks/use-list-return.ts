"use client";

import { useSyncExternalStore } from "react";

import { readListReturn } from "@/lib/list-return";

const subscribe = () => () => {};

export const useListReturn = (listPath: string): string =>
  useSyncExternalStore(
    subscribe,
    () => readListReturn(listPath),
    () => listPath,
  );
