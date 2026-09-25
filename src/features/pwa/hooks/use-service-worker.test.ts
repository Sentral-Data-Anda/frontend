import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, jest, test } from "bun:test";

import { useServiceWorker } from "./use-service-worker";

const onStubServiceWorker = (controller: ServiceWorker | null) => {
  const listeners = new Set<() => void>();
  let onUpdateFound = () => {};
  const registration = {
    waiting: null,
    installing: null as ServiceWorker | null,
    addEventListener: (_type: string, listener: () => void) => {
      onUpdateFound = listener;
    },
  };
  const registered = Promise.resolve(registration);

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
    onInstalled: () => {
      let onStateChange = () => {};
      registration.installing = {
        state: "installed",
        postMessage: () => {},
        addEventListener: (_type: string, listener: () => void) => {
          onStateChange = listener;
        },
      } as unknown as ServiceWorker;
      onUpdateFound();
      onStateChange();
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

  test("kunjungan pertama lalu update v2 memuat ulang tepat sekali", async () => {
    const sw = onStubServiceWorker(null);
    const { result } = renderHook(() => useServiceWorker());
    await sw.registered;

    sw.onClaim();
    expect(reload).not.toHaveBeenCalled();

    act(() => sw.onInstalled());
    expect(result.current.updateReady).toBe(true);

    act(() => result.current.applyUpdate());
    sw.onClaim();
    sw.onClaim();

    await waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
  });
});
