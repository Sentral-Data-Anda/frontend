import { describe, expect, test } from "bun:test";

import type { MenuNode } from "@/features/auth/types";

import { TREE } from "../../scripts/menu-tree";

import {
  MENU,
  MENU_ICON,
  MENU_LEAF_ICON,
  domainEntryHref,
  domainHref,
  leafIcon,
} from "./menu";

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

describe("MENU_LEAF_ICON", () => {
  test("ke-61 layar punya ikon", () => {
    const leaves = Object.values(TREE).flat();

    expect(leaves).toHaveLength(61);
    expect(leaves.filter((slug) => !MENU_LEAF_ICON[slug])).toEqual([]);
  });

  test.each(Object.entries(TREE))(
    "%s: tidak ada ikon layar ganda",
    (_, leaves) => {
      const icons = leaves.map((slug) => MENU_LEAF_ICON[slug]);

      expect(new Set(icons).size).toBe(leaves.length);
    },
  );
});

describe("leafIcon", () => {
  test("layar terpetakan memakai ikonnya sendiri", () => {
    expect(leafIcon(MENU.KELUARGA, MENU.KEJEMAATAN)).toBe(
      MENU_LEAF_ICON[MENU.KELUARGA],
    );
  });

  test("slug asing jatuh ke ikon domain", () => {
    expect(leafIcon("LAYAR_BARU", MENU.KEJEMAATAN)).toBe(
      MENU_ICON[MENU.KEJEMAATAN],
    );
  });
});
