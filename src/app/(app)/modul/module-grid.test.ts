import { describe, expect, test } from "bun:test";

import type { MenuNode } from "@/features/auth/types";

import { filterDomains } from "./module-grid";

const keuangan: MenuNode = {
  publicId: "1",
  slug: "KEUANGAN",
  name: "Keuangan",
  order: 1,
  action: [],
  children: [
    {
      publicId: "2",
      slug: "KAS_KELUAR",
      name: "Kas Keluar",
      order: 1,
      action: ["VIEW"],
      children: [],
    },
  ],
};

const kejemaatan: MenuNode = {
  publicId: "3",
  slug: "KEJEMAATAN",
  name: "Kejemaatan",
  order: 2,
  action: [],
  children: [
    {
      publicId: "4",
      slug: "DAFTAR_JEMAAT",
      name: "Daftar Jemaat",
      order: 1,
      action: ["VIEW"],
      children: [],
    },
  ],
};

const domains: MenuNode[] = [keuangan, kejemaatan];

describe("filterDomains", () => {
  test("kata kunci kosong mengembalikan seluruh domain apa adanya", () => {
    expect(filterDomains(domains, "")).toBe(domains);
  });

  test("cocok lewat nama domain", () => {
    expect(filterDomains(domains, "kejemaatan")).toEqual([kejemaatan]);
  });

  test("cocok lewat nama layar, bukan hanya nama domain", () => {
    expect(filterDomains(domains, "kas keluar")).toEqual([keuangan]);
  });

  test("tidak ada yang cocok mengembalikan larik kosong", () => {
    expect(filterDomains(domains, "tidak ada begini")).toEqual([]);
  });

  // Yang diketik user lewat begitu saja ke sini — huruf besar dari
  // autokapitalisasi keyboard ponsel, dan spasi ujung dari tap spasi setelah
  // kata. Keduanya harus dinormalkan di dalam fungsi, bukan diandalkan dari
  // pemanggil.
  test("menormalkan huruf besar pada kata kunci", () => {
    expect(filterDomains(domains, "Kas Keluar")).toEqual([keuangan]);
  });

  test("menormalkan spasi di ujung kata kunci", () => {
    expect(filterDomains(domains, "  Kejemaatan  ")).toEqual([kejemaatan]);
  });

  test("kata kunci berisi spasi saja dianggap kosong", () => {
    expect(filterDomains(domains, "   ")).toBe(domains);
  });
});
