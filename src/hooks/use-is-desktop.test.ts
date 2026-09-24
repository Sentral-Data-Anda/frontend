import { readFileSync } from "node:fs";

import { describe, expect, test } from "bun:test";

import { DESKTOP_MEDIA_QUERY, TABLE_MEDIA_QUERY } from "./use-is-desktop";

const read = (path: string) => readFileSync(path, "utf8");

/**
 * Shell menukar navigasi lewat `lg:` Tailwind, `useIsDesktop` memilih mode
 * data lewat `matchMedia`. Kalau keduanya berselisih, ada rentang lebar di mana
 * sidebar desktop tampil bersama infinite scroll (atau bottom tab bersama
 * pager bernomor). Test ini gagal begitu salah satunya digeser sendirian.
 */
describe("DESKTOP_MEDIA_QUERY", () => {
  test("sama dengan --breakpoint-lg Tailwind yang dipakai shell", () => {
    const override = read("src/app/globals.css").match(
      /--breakpoint-lg:\s*([^;]+);/,
    );
    const fallback = read("node_modules/tailwindcss/theme.css").match(
      /--breakpoint-lg:\s*([^;]+);/,
    );
    const lg = (override ?? fallback)?.[1]?.trim();

    expect(DESKTOP_MEDIA_QUERY).toBe(`(min-width: ${lg})`);
  });
});

describe("TABLE_MEDIA_QUERY", () => {
  test("sama dengan --breakpoint-md yang dipakai kerangka LoadingDataList", () => {
    const override = read("src/app/globals.css").match(
      /--breakpoint-md:\s*([^;]+);/,
    );
    const fallback = read("node_modules/tailwindcss/theme.css").match(
      /--breakpoint-md:\s*([^;]+);/,
    );
    const md = (override ?? fallback)?.[1]?.trim();

    expect(TABLE_MEDIA_QUERY).toBe(`(min-width: ${md})`);
    expect(read("src/components/common/list/loading-list.tsx")).toContain(
      '"hidden md:block"',
    );
  });
});
