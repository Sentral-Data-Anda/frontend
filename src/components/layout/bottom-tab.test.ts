import { describe, expect, test } from "bun:test";
import { House } from "lucide-react";

import type { MenuNode } from "@/features/auth/types";

import { getVisibleTabs, isTabActive, type Tab } from "./bottom-tab";

// Ikon aslinya tidak relevan untuk logika yang diuji di sini; satu ikon
// dipakai ulang supaya fixture cocok dengan tipe `LucideIcon` tanpa palsu.
const TABS: Tab[] = [
  { label: "Dashboard", href: "/", icon: House, slug: null },
  { label: "Ibadah", href: "/peribadahan/ibadah", icon: House, slug: "IBADAH" },
  {
    label: "Warta",
    href: "/kegiatan/pengumuman",
    icon: House,
    slug: "PENGUMUMAN",
  },
];

const menuTanpaPengumuman: MenuNode[] = [
  {
    publicId: "1",
    slug: "PERIBADAHAN",
    name: "Peribadahan",
    order: 1,
    action: [],
    children: [
      {
        publicId: "2",
        slug: "IBADAH",
        name: "Ibadah",
        order: 1,
        action: ["VIEW"],
        children: [],
      },
    ],
  },
];

const menuLengkap: MenuNode[] = [
  ...menuTanpaPengumuman,
  {
    publicId: "3",
    slug: "KEGIATAN",
    name: "Kegiatan",
    order: 2,
    action: [],
    children: [
      {
        publicId: "4",
        slug: "PENGUMUMAN",
        name: "Pengumuman",
        order: 1,
        action: ["VIEW"],
        children: [],
      },
    ],
  },
];

describe("getVisibleTabs", () => {
  test("menu tanpa PENGUMUMAN membuang tab Warta tapi mempertahankan Dashboard", () => {
    const tabs = getVisibleTabs(TABS, menuTanpaPengumuman);

    expect(tabs.map((tab) => tab.label)).toEqual(["Dashboard", "Ibadah"]);
  });

  test("menu lengkap menampilkan seluruh tab", () => {
    const tabs = getVisibleTabs(TABS, menuLengkap);

    expect(tabs.map((tab) => tab.label)).toEqual([
      "Dashboard",
      "Ibadah",
      "Warta",
    ]);
  });
});

describe("isTabActive", () => {
  test("'/' tidak aktif untuk rute lain", () => {
    expect(isTabActive("/", "/peribadahan/ibadah")).toBe(false);
  });

  test("rute lain aktif lewat startsWith", () => {
    expect(isTabActive("/peribadahan/ibadah", "/peribadahan/ibadah")).toBe(
      true,
    );
  });

  test("'/' aktif tepat di '/'", () => {
    expect(isTabActive("/", "/")).toBe(true);
  });

  test("halaman domain tidak menyalakan tab mana pun", () => {
    for (const tab of TABS) {
      expect(isTabActive(tab.href, "/peribadahan")).toBe(false);
    }
  });
});
