"use client";

import { useSyncExternalStore } from "react";

let clientNow: Date | null = null;

const subscribe = () => () => {};

export const useNow = (): Date | null =>
  useSyncExternalStore(
    subscribe,
    () => (clientNow ??= new Date()),
    () => null,
  );
