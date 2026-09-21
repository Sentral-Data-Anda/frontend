import { describe, expect, test } from "bun:test";

import type { MenuNode } from "@/features/auth/types";

import { MENU, domainEntryHref, domainHref } from "./menu";

const leaf = (slug: string): MenuNode => ({
  publicId: slug,
  slug,
  name: slug,
  order: 1,
  action: ["VIEW"],
  children: [],
});

const domain = (slug: string, leaves: string[]): MenuNode => ({
  ...leaf(slug),
  action: [],
  children: leaves.map(leaf),
});

describe("domainHref", () => {
  test("kebab-case dari slug domain", () => {
    expect(domainHref(MENU.KEJEMAATAN)).toBe("/kejemaatan");
  });
});

describe("domainEntryHref", () => {
  test("satu layar langsung ke layar itu", () => {
    expect(domainEntryHref(domain(MENU.PERIBADAHAN, [MENU.IBADAH]))).toBe(
      "/peribadahan/ibadah",
    );
  });

  test("banyak layar ke halaman domain", () => {
    expect(
      domainEntryHref(
        domain(MENU.KEJEMAATAN, [MENU.DAFTAR_JEMAAT, MENU.KELUARGA]),
      ),
    ).toBe("/kejemaatan");
  });
});
