import { describe, expect, test } from "bun:test";

import { MENU } from "@/config/menu";
import type { MenuNode } from "@/types/menu";

import { searchModules } from "./model";

const leaf = (publicId: string, slug: string, name: string): MenuNode => ({
  publicId,
  slug,
  name,
  order: 1,
  action: ["VIEW"],
  children: [],
});

const kasKeluar = leaf("2", MENU.KAS_KELUAR, "Kas Keluar");
const kasMasuk = leaf("5", MENU.KAS_MASUK, "Kas Masuk");
const daftarJemaat = leaf("4", MENU.DAFTAR_JEMAAT, "Daftar Jemaat");
const keluarga = leaf("6", MENU.KELUARGA, "Keluarga");

const keuangan: MenuNode = {
  publicId: "1",
  slug: "KEUANGAN",
  name: "Keuangan",
  order: 1,
  action: [],
  children: [kasKeluar, kasMasuk],
};

const kejemaatan: MenuNode = {
  publicId: "3",
  slug: "KEJEMAATAN",
  name: "Kejemaatan",
  order: 2,
  action: [],
  children: [daftarJemaat, keluarga],
};

const domains: MenuNode[] = [keuangan, kejemaatan];

describe("searchModules", () => {
  test("kata kunci kosong mengembalikan seluruh domain apa adanya", () => {
    expect(searchModules(domains, "")).toEqual({ kind: "domains", domains });
  });

  test("kata kunci berisi spasi saja dianggap kosong", () => {
    expect(searchModules(domains, "   ").kind).toBe("domains");
  });

  test("cocok lewat nama layar", () => {
    expect(searchModules(domains, "kas keluar")).toEqual({
      kind: "screens",
      hits: [{ domain: keuangan, leaf: kasKeluar }],
    });
  });

  test("cocok lewat penjelasan layar", () => {
    expect(searchModules(domains, "cari data")).toEqual({
      kind: "screens",
      hits: [{ domain: kejemaatan, leaf: daftarJemaat }],
    });
  });

  test("cocok lewat nama domain mengembalikan semua layarnya", () => {
    expect(searchModules(domains, "keuangan")).toEqual({
      kind: "screens",
      hits: [
        { domain: keuangan, leaf: kasKeluar },
        { domain: keuangan, leaf: kasMasuk },
      ],
    });
  });

  test("tidak ada yang cocok mengembalikan daftar layar kosong", () => {
    expect(searchModules(domains, "tidak ada begini")).toEqual({
      kind: "screens",
      hits: [],
    });
  });

  test("tidak peka huruf besar dan spasi berlebih", () => {
    expect(searchModules(domains, "  Kas   KELUAR ")).toEqual({
      kind: "screens",
      hits: [{ domain: keuangan, leaf: kasKeluar }],
    });
  });
});
