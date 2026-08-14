import { afterEach, describe, expect, test } from "bun:test";

import { serviceWorkerUrl, shouldRegisterServiceWorker } from "./register";

/**
 * `NODE_ENV` dideklarasikan read-only oleh tipe environment, padahal test ini
 * memang perlu menggantinya untuk menguji kedua cabang. Cast di sini
 * mempersempit pelanggarannya ke satu tempat yang jelas.
 */
const mutableEnv = process.env as Record<string, string | undefined>;
const ORIGINAL_NODE_ENV = process.env.NODE_ENV;

afterEach(() => {
  delete mutableEnv.NEXT_PUBLIC_BUILD_ID;
  delete mutableEnv.NEXT_PUBLIC_ENABLE_SW;
  mutableEnv.NODE_ENV = ORIGINAL_NODE_ENV;
});

describe("serviceWorkerUrl", () => {
  test("menstempel build id sebagai query — inilah yang membuat browser melihat versi baru", () => {
    mutableEnv.NEXT_PUBLIC_BUILD_ID = "abc123";
    expect(serviceWorkerUrl()).toBe("/sw.js?v=abc123");
  });

  test("jatuh ke 'dev' bila build id kosong", () => {
    expect(serviceWorkerUrl()).toBe("/sw.js?v=dev");
  });

  test("build id di-encode supaya karakter khusus tidak merusak URL", () => {
    mutableEnv.NEXT_PUBLIC_BUILD_ID = "feat/pwa 2";
    expect(serviceWorkerUrl()).toBe("/sw.js?v=feat%2Fpwa%202");
  });
});

describe("shouldRegisterServiceWorker", () => {
  test("aktif di production", () => {
    mutableEnv.NODE_ENV = "production";
    expect(shouldRegisterServiceWorker()).toBe(true);
  });

  test("mati di development supaya cache basi tidak mengganggu", () => {
    mutableEnv.NODE_ENV = "development";
    expect(shouldRegisterServiceWorker()).toBe(false);
  });

  test("bisa dibuka di development lewat flag eksplisit, supaya tetap bisa diuji", () => {
    mutableEnv.NODE_ENV = "development";
    mutableEnv.NEXT_PUBLIC_ENABLE_SW = "1";
    expect(shouldRegisterServiceWorker()).toBe(true);
  });
});
