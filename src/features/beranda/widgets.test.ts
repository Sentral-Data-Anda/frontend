import { describe, expect, test } from "bun:test";

import { MENU } from "@/config/menu";
import type { MenuNode } from "@/features/auth/types";

import { MAX_KPI, selectWidgets, type Widget } from "./widgets";

const leaf = (slug: string, action: MenuNode["action"]): MenuNode => ({
  publicId: slug,
  slug,
  name: slug,
  order: 1,
  action,
  children: [],
});

const domain = (children: MenuNode[]): MenuNode => ({
  ...leaf("DOMAIN", []),
  children,
});

const Noop = () => null;

const widget = (
  id: string,
  slot: Widget["slot"],
  gate: Widget["gate"] = [],
  isDummy = false,
): Widget => ({ id, slot, gate, isDummy, Component: Noop });

const ids = (list: Widget[]) => list.map((w) => w.id);

describe("selectWidgets", () => {
  test("gate: semua syarat harus dipegang, aksinya persis", () => {
    const widgets = [
      widget("dua-izin", "main", [
        { slug: MENU.LAPORAN_KEUANGAN, action: "VIEW" },
        { slug: MENU.KAS_KELUAR, action: "VIEW" },
      ]),
      widget("create", "main", [{ slug: MENU.KAS_KELUAR, action: "CREATE" }]),
      widget("bebas", "main"),
    ];
    const menu = [domain([leaf(MENU.KAS_KELUAR, ["VIEW"])])];

    expect(ids(selectWidgets(menu, widgets, true).main)).toEqual(["bebas"]);

    const both = [
      domain([
        leaf(MENU.KAS_KELUAR, ["VIEW"]),
        leaf(MENU.LAPORAN_KEUANGAN, ["VIEW"]),
      ]),
    ];
    expect(ids(selectWidgets(both, widgets, true).main)).toEqual([
      "dua-izin",
      "bebas",
    ]);
  });

  test("widget dummy tidak pernah dipilih di production", () => {
    const widgets = [widget("asli", "side"), widget("palsu", "side", [], true)];

    expect(ids(selectWidgets([], widgets, false).main)).toEqual(["asli"]);
    expect(ids(selectWidgets([], widgets, true).side)).toEqual(["palsu"]);
  });

  test(`KPI dibatasi ${MAX_KPI} sel, urutan registry`, () => {
    const widgets = Array.from({ length: 6 }, (_, i) => widget(`k${i}`, "kpi"));

    expect(ids(selectWidgets([], widgets, true).kpi)).toEqual([
      "k0",
      "k1",
      "k2",
      "k3",
    ]);
  });

  test("main kosong → widget samping pertama naik ke main", () => {
    const widgets = [widget("s1", "side"), widget("s2", "side")];
    const picked = selectWidgets([], widgets, true);

    expect(ids(picked.main)).toEqual(["s1"]);
    expect(ids(picked.side)).toEqual(["s2"]);
  });

  test("main terisi → samping apa adanya", () => {
    const picked = selectWidgets(
      [],
      [widget("m", "main"), widget("s1", "side")],
      true,
    );

    expect(ids(picked.main)).toEqual(["m"]);
    expect(ids(picked.side)).toEqual(["s1"]);
  });
});
