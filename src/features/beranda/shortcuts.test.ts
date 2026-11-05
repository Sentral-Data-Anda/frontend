import { describe, expect, test } from "bun:test";

import { DOMAIN_SLUGS, MENU } from "@/config/menu";
import type { MenuNode } from "@/types/menu";

import { pickShortcuts, SHORTCUT_LIMIT } from "./shortcuts";

const domain = (slug: string): MenuNode => ({
  publicId: slug,
  slug,
  name: slug,
  order: 1,
  action: [],
  children: [],
});

describe("pickShortcuts", () => {
  test("mengikuti urutan Aksi cepat, bukan urutan pohon menu", () => {
    const result = pickShortcuts([
      domain(MENU.KEGIATAN),
      domain(MENU.KEJEMAATAN),
    ]);

    expect(result.domains.map(({ slug }) => slug)).toEqual([
      MENU.KEJEMAATAN,
      MENU.KEGIATAN,
    ]);
    expect(result.isTruncated).toBe(false);
  });

  test("menu di luar daftar tetap tampil, sesudah yang utama", () => {
    const result = pickShortcuts([
      domain(MENU.SETTINGS),
      domain(MENU.KEJEMAATAN),
      domain(MENU.APPROVAL),
    ]);

    expect(result.domains.map(({ slug }) => slug)).toEqual([
      MENU.KEJEMAATAN,
      MENU.SETTINGS,
      MENU.APPROVAL,
    ]);
  });

  test("domain yang tidak dipegang tidak ikut", () => {
    const result = pickShortcuts([domain(MENU.KEGIATAN)]);

    expect(result.domains.map(({ slug }) => slug)).toEqual([MENU.KEGIATAN]);
  });

  test(`memotong di ${SHORTCUT_LIMIT} dan menandai kelebihan`, () => {
    const result = pickShortcuts(DOMAIN_SLUGS.map(domain));

    expect(result.domains).toHaveLength(SHORTCUT_LIMIT);
    expect(result.domains.map(({ slug }) => slug)).not.toContain(
      MENU.PERIBADAHAN,
    );
    expect(result.isTruncated).toBe(true);
  });

  test(`tepat ${SHORTCUT_LIMIT} domain belum terpotong`, () => {
    const result = pickShortcuts(
      DOMAIN_SLUGS.slice(0, SHORTCUT_LIMIT).map(domain),
    );

    expect(result.domains).toHaveLength(SHORTCUT_LIMIT);
    expect(result.isTruncated).toBe(false);
  });

  test("menu kosong", () => {
    expect(pickShortcuts([])).toEqual({ domains: [], isTruncated: false });
  });
});
