import { describe, expect, test } from "bun:test";

import {
  DASHBOARD_VIEW_COOKIE,
  dashboardViewCookie,
  readDashboardView,
  saveDashboardView,
} from "./view";

describe("readDashboardView", () => {
  test("menerima grup yang dikenal", () => {
    expect(readDashboardView("finance")).toBe("finance");
    expect(readDashboardView("umum")).toBe("umum");
  });

  test("menerima Semua", () => {
    expect(readDashboardView("all")).toBe("all");
  });

  test("nilai asing atau kosong = belum memilih", () => {
    for (const value of [undefined, "", "keuangan", "__proto__"]) {
      expect(readDashboardView(value)).toBeUndefined();
    }
  });
});

test("cookie: path, umur, dan SameSite sama dengan sidebar", () => {
  expect(dashboardViewCookie("umum")).toBe(
    `${DASHBOARD_VIEW_COOKIE}=umum; Path=/; Max-Age=31536000; SameSite=Lax`,
  );
});

test("pilihan tersimpan di cookie, bukan di memori halaman", () => {
  saveDashboardView("finance");

  expect(document.cookie).toContain(`${DASHBOARD_VIEW_COOKIE}=finance`);
  expect(
    readDashboardView(
      document.cookie
        .split("; ")
        .find((part) => part.startsWith(`${DASHBOARD_VIEW_COOKIE}=`))
        ?.slice(DASHBOARD_VIEW_COOKIE.length + 1),
    ),
  ).toBe("finance");
});
