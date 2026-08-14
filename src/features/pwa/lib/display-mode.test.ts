import { afterEach, describe, expect, test } from "bun:test";

import { isIOS, isStandalone, needsManualInstallGuide } from "./display-mode";

/**
 * Fungsi-fungsi ini membaca `window.navigator` dan `window.matchMedia`, yang
 * tidak ada di runtime Bun. Test memasang window tiruan seminimal mungkin —
 * yang diuji adalah logika percabangannya, bukan browser.
 */
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

afterEach(() => {
  delete (globalThis as { window?: unknown }).window;
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
    // Pembeda satu-satunya dari kasus di atas: Mac melaporkan maxTouchPoints 0.
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
    // Safari iOS versi lama tidak mencocoki media query itu; satu-satunya
    // penanda adalah properti non-standar navigator.standalone.
    setWindow({ userAgent: IPHONE, standalone: true });
    expect(isStandalone()).toBe(true);
  });

  test("false saat berjalan di tab browser biasa", () => {
    setWindow({ userAgent: IPHONE, standalone: false });
    expect(isStandalone()).toBe(false);
  });
});

describe("needsManualInstallGuide", () => {
  test("true di iOS yang belum terpasang — tidak ada prompt otomatis di sana", () => {
    setWindow({ userAgent: IPHONE, standalone: false });
    expect(needsManualInstallGuide()).toBe(true);
  });

  test("false di iOS yang sudah terpasang", () => {
    setWindow({ userAgent: IPHONE, standalone: true });
    expect(needsManualInstallGuide()).toBe(false);
  });

  test("false di non-iOS — di sana beforeinstallprompt yang dipakai", () => {
    setWindow({ userAgent: WINDOWS });
    expect(needsManualInstallGuide()).toBe(false);
  });
});
