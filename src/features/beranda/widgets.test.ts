import { describe, expect, test } from "bun:test";

import { MENU } from "@/config/menu";
import type { MenuNode } from "@/features/auth/types";

import { TREE } from "../../../scripts/menu-tree";
import { actionsOf, PERSONAS } from "../../../scripts/mock-dashboard";

import { MAX_KPI, selectWidgets, WIDGETS, type Widget } from "./widgets";

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

    expect(ids(selectWidgets([], widgets, true).kpi)).toEqual(
      ["k0", "k1", "k2", "k3", "k4", "k5"].slice(0, MAX_KPI),
    );
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

describe("persona dev:mock", () => {
  // Pohon menu seperti `menuService.findTree` untuk persona di
  // scripts/mock-dashboard.ts — hasilnya harus sama dengan rancangan
  // dashboard-desktop.md §3b/3c/3e.
  const menuOf = (key: string): MenuNode[] =>
    Object.entries(TREE).flatMap(([slug, leaves]) => {
      const children = leaves.flatMap((child) => {
        const action = actionsOf(PERSONAS[key], child);
        return action.length ? [leaf(child, action)] : [];
      });
      return children.length ? [{ ...leaf(slug, []), children }] : [];
    });

  const picked = (key: string, isDummyShown = false) => {
    const { kpi, main, side } = selectWidgets(
      menuOf(key),
      undefined,
      isDummyShown,
    );
    return { kpi: ids(kpi), main: ids(main), side: ids(side) };
  };

  test("sekretariat: tanpa angka keuangan, Agenda di main", () => {
    expect(picked("sekretariat")).toEqual({
      kpi: ["kpi-agenda-week", "kpi-pending-loans", "kpi-birthdays"],
      main: ["agenda"],
      side: ["loan-rooms", "birthdays", "announcements", "my-offerings"],
    });
  });

  test("majelis: tindakan dulu", () => {
    const { kpi, main } = picked("majelis");
    expect(kpi[0]).toBe("kpi-waiting-approvals");
    expect(main[0]).toBe("approvals");
  });

  test("bendahara: perlu dibayar, tanpa antrean persetujuan", () => {
    const { main } = picked("bendahara");
    expect(main).toContain("cash-expense");
    expect(main).not.toContain("approvals");
  });

  test("production: tidak ada widget dummy untuk persona mana pun", () => {
    const dummies = new Set(WIDGETS.filter((w) => w.isDummy).map((w) => w.id));

    for (const key of Object.keys(PERSONAS)) {
      const { kpi, main, side } = picked(key);
      expect(
        [...kpi, ...main, ...side].filter((id) => dummies.has(id)),
      ).toEqual([]);
    }
    expect(picked("majelis", true).main).toContain("budget-use");
    expect(picked("majelis", true).kpi).toContain("kpi-budget-high");
  });
});
