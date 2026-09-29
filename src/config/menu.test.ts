import { describe, expect, test } from "bun:test";

import type { MenuNode } from "@/types/menu";

import { TREE } from "../../scripts/menu-tree";

import {
  MENU,
  MENU_ICON,
  MENU_LEAF_ICON,
  domainEntryHref,
  domainHref,
  leafIcon,
  createHref,
  editHref,
  isFormRoute,
  rejectHref,
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
  test("ke-64 layar punya ikon", () => {
    const leaves = Object.values(TREE).flat();

    expect(leaves).toHaveLength(64);
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

describe("rute layar isian", () => {
  test("rute tambah dan ubah diturunkan dari rute layarnya", () => {
    expect(createHref(MENU.KEJEMAATAN, MENU.DAFTAR_JEMAAT)).toBe(
      "/kejemaatan/daftar-jemaat/baru",
    );
    expect(editHref(MENU.KEJEMAATAN, MENU.DAFTAR_JEMAAT, "JMT-0042")).toBe(
      "/kejemaatan/daftar-jemaat/JMT-0042/ubah",
    );
  });

  test("keduanya dikenali sebagai layar isian", () => {
    expect(isFormRoute("/kejemaatan/daftar-jemaat/baru")).toBe(true);
    expect(isFormRoute("/kejemaatan/daftar-jemaat/JMT-0042/ubah")).toBe(true);
    expect(isFormRoute("/kejemaatan/pernikahan/abc/akhiri")).toBe(true);
    expect(isFormRoute("/kejemaatan/keluarga/KK-0001/anggota/baru")).toBe(true);
    expect(isFormRoute("/peribadahan/ibadah/giliran")).toBe(true);
    expect(isFormRoute("/inventaris/barang/label")).toBe(true);
  });

  test("halaman tolak permintaan adalah layar isian", () => {
    const href = rejectHref(
      MENU.PERSETUJUAN,
      MENU.PERMINTAAN_PERSETUJUAN,
      "0b1c-uuid",
    );

    expect(href).toBe("/persetujuan/permintaan-persetujuan/0b1c-uuid/tolak");
    expect(isFormRoute(href)).toBe(true);
  });

  test("layar daftar, halaman domain, dan Beranda bukan layar isian", () => {
    expect(isFormRoute("/kejemaatan/daftar-jemaat")).toBe(false);
    expect(isFormRoute("/kejemaatan")).toBe(false);
    expect(isFormRoute("/")).toBe(false);
  });

  test("layar ber-slug baru/ubah TIDAK ikut kehilangan navigasi", () => {
    expect(isFormRoute("/kegiatan/baru")).toBe(false);
    expect(isFormRoute("/kegiatan/ubah")).toBe(false);
    expect(isFormRoute("/peribadahan/giliran")).toBe(false);
  });
});
