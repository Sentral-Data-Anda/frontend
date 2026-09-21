import { describe, expect, test } from "bun:test";

import type { MenuNode } from "@/features/auth/types";

import { resolveDomain } from "./resolve-domain";

const node = (slug: string, children: MenuNode[] = []): MenuNode => ({
  publicId: slug,
  slug,
  name: slug,
  order: 1,
  action: children.length ? [] : ["VIEW"],
  children,
});

const menu: MenuNode[] = [
  node("KEJEMAATAN", [node("DAFTAR_JEMAAT"), node("KELUARGA")]),
  node("PERIBADAHAN", [node("IBADAH")]),
  node("FASILITAS"),
];

describe("resolveDomain", () => {
  test("domain berlayar banyak dirender", () => {
    const result = resolveDomain(menu, "kejemaatan");

    expect(result.kind).toBe("page");
  });

  test("slug yang bukan domain → 404", () => {
    expect(resolveDomain(menu, "favicon.ico")).toEqual({ kind: "not-found" });
    expect(resolveDomain(menu, "daftar-jemaat")).toEqual({
      kind: "not-found",
    });
  });

  test("domain yang tidak dipegang peran → 404", () => {
    expect(resolveDomain(menu, "keuangan")).toEqual({ kind: "not-found" });
  });

  test("domain tanpa layar → 404", () => {
    expect(resolveDomain(menu, "fasilitas")).toEqual({ kind: "not-found" });
  });

  test("domain berlayar satu dialihkan ke layar itu", () => {
    expect(resolveDomain(menu, "peribadahan")).toEqual({
      kind: "redirect",
      href: "/peribadahan/ibadah",
    });
  });
});
