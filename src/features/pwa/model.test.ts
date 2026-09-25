import { afterEach, describe, expect, test } from "bun:test";

import {
  isIOS,
  isStandalone,
  isManualInstallGuideNeeded,
  serviceWorkerUrl,
  isServiceWorkerEnabled,
} from "./model";

type FakeWindow = {
  navigator: {
    userAgent: string;
    maxTouchPoints: number;
    standalone?: boolean;
  };
  matchMedia: (query: string) => { matches: boolean };
};

function setWindow(options: {
  userAgent: string;
  maxTouchPoints?: number;
  standalone?: boolean;
  displayModeStandalone?: boolean;
}) {
  const fake: FakeWindow = {
    navigator: {
      userAgent: options.userAgent,
      maxTouchPoints: options.maxTouchPoints ?? 0,
      standalone: options.standalone,
    },
    matchMedia: (query: string) => ({
      matches:
        query === "(display-mode: standalone)" &&
        options.displayModeStandalone === true,
    }),
  };

  (globalThis as { window?: unknown }).window = fake;
}

const REAL_WINDOW = (globalThis as { window?: unknown }).window;

afterEach(() => {
  (globalThis as { window?: unknown }).window = REAL_WINDOW;
});

const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)";
const IPADOS = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)";
const MAC = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)";
const WINDOWS = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)";

describe("isIOS", () => {
  test("mengenali iPhone", () => {
    setWindow({ userAgent: IPHONE });
    expect(isIOS()).toBe(true);
  });

  test("mengenali iPadOS yang menyamar sebagai Macintosh lewat maxTouchPoints", () => {
    setWindow({ userAgent: IPADOS, maxTouchPoints: 5 });
    expect(isIOS()).toBe(true);
  });

  test("Mac sungguhan tidak dianggap iOS", () => {
    setWindow({ userAgent: MAC, maxTouchPoints: 0 });
    expect(isIOS()).toBe(false);
  });

  test("Windows tidak dianggap iOS", () => {
    setWindow({ userAgent: WINDOWS });
    expect(isIOS()).toBe(false);
  });
});

describe("isStandalone", () => {
  test("true saat media query display-mode standalone cocok", () => {
    setWindow({ userAgent: WINDOWS, displayModeStandalone: true });
    expect(isStandalone()).toBe(true);
  });

  test("true di Safari iOS lewat navigator.standalone", () => {
    setWindow({ userAgent: IPHONE, standalone: true });
    expect(isStandalone()).toBe(true);
  });

  test("false saat berjalan di tab browser biasa", () => {
    setWindow({ userAgent: IPHONE, standalone: false });
    expect(isStandalone()).toBe(false);
  });
});

describe("isManualInstallGuideNeeded", () => {
  test("true di iOS yang belum terpasang — tidak ada prompt otomatis di sana", () => {
    setWindow({ userAgent: IPHONE, standalone: false });
    expect(isManualInstallGuideNeeded()).toBe(true);
  });

  test("false di iOS yang sudah terpasang", () => {
    setWindow({ userAgent: IPHONE, standalone: true });
    expect(isManualInstallGuideNeeded()).toBe(false);
  });

  test("false di non-iOS — di sana beforeinstallprompt yang dipakai", () => {
    setWindow({ userAgent: WINDOWS });
    expect(isManualInstallGuideNeeded()).toBe(false);
  });
});

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

describe("isServiceWorkerEnabled", () => {
  test("aktif di production", () => {
    mutableEnv.NODE_ENV = "production";
    expect(isServiceWorkerEnabled()).toBe(true);
  });

  test("mati di development supaya cache basi tidak mengganggu", () => {
    mutableEnv.NODE_ENV = "development";
    expect(isServiceWorkerEnabled()).toBe(false);
  });

  test("bisa dibuka di development lewat flag eksplisit, supaya tetap bisa diuji", () => {
    mutableEnv.NODE_ENV = "development";
    mutableEnv.NEXT_PUBLIC_ENABLE_SW = "1";
    expect(isServiceWorkerEnabled()).toBe(true);
  });
});
