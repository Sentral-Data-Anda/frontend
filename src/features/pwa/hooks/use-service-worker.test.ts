import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, jest, test } from "bun:test";

import { useServiceWorker } from "./use-service-worker";

/**
 * `navigator.serviceWorker` tiruan: `onClaim` memicu `controllerchange`
 * seperti `clients.claim()` di sw.js, baik pada instalasi pertama maupun
 * setelah `SKIP_WAITING`.
 */
const onStubServiceWorker = (controller: ServiceWorker | null) => {
  const listeners = new Set<() => void>();
  const registered = Promise.resolve({
    waiting: null,
    addEventListener: () => {},
  });

  const container = {
    controller,
    register: () => registered,
    addEventListener: (_type: string, listener: () => void) =>
      listeners.add(listener),
    removeEventListener: (_type: string, listener: () => void) =>
      listeners.delete(listener),
  };

  Object.defineProperty(navigator, "serviceWorker", {
    value: container,
    configurable: true,
  });

  return {
    registered,
    onClaim: () => {
      container.controller = {} as ServiceWorker;
      for (const listener of listeners) listener();
    },
  };
};

const reload = jest.fn();
const originalLocation = window.location;

beforeEach(() => {
  process.env.NEXT_PUBLIC_ENABLE_SW = "1";
  reload.mockClear();
  Object.defineProperty(window, "location", {
    value: { ...originalLocation, reload },
    configurable: true,
  });
});

afterEach(() => {
  cleanup();
  delete process.env.NEXT_PUBLIC_ENABLE_SW;
  Object.defineProperty(window, "location", {
    value: originalLocation,
    configurable: true,
  });
  Reflect.deleteProperty(navigator, "serviceWorker");
});

describe("useServiceWorker — controllerchange", () => {
  test("kunjungan pertama (clients.claim) tidak memuat ulang", async () => {
    const sw = onStubServiceWorker(null);
    renderHook(() => useServiceWorker());
    await sw.registered;

    sw.onClaim();

    expect(reload).not.toHaveBeenCalled();
  });

  test("pergantian versi memuat ulang tepat sekali", async () => {
    const sw = onStubServiceWorker({} as ServiceWorker);
    renderHook(() => useServiceWorker());
    await sw.registered;

    sw.onClaim();
    sw.onClaim();

    await waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
  });
});
