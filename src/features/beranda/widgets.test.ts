import { describe, expect, test } from "bun:test";

import { MENU } from "@/config/menu";
import type { MenuNode } from "@/features/auth/types";

import { TREE } from "../../../scripts/menu-tree";
import { actionsOf, PERSONAS } from "../../../scripts/mock-dashboard";

import {
  MAX_KPI,
  selectWidgets,
  WIDGETS,
  type KpiGroup,
  type Widget,
} from "./widgets";

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
): Widget => ({
  id,
  slot,
  gate,
  isDummy,
  group: slot === "kpi" ? "umum" : undefined,
  Component: Noop,
});

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

describe("grup KPI", () => {
  const kpi = (id: string, group: KpiGroup, slug?: string): Widget => ({
    id,
    slot: "kpi",
    group,
    gate: slug
      ? [{ slug: slug as Widget["gate"][number]["slug"], action: "VIEW" }]
      : [],
    Component: Noop,
  });

  test("strip tidak pernah mencampur grup; grup terbanyak menang", () => {
    const widgets = [
      kpi("f1", "finance"),
      kpi("u1", "umum"),
      kpi("u2", "umum"),
    ];
    const picked = selectWidgets([], widgets, true);

    expect(picked.kind).toBe("umum");
    expect(ids(picked.kpi)).toEqual(["u1", "u2"]);
  });

  test("seri → finance; dihitung setelah batas MAX_KPI", () => {
    const widgets = [
      ...Array.from({ length: 5 }, (_, i) => kpi(`f${i}`, "finance")),
      ...Array.from({ length: 6 }, (_, i) => kpi(`u${i}`, "umum")),
    ];

    expect(selectWidgets([], widgets, true).kind).toBe("finance");
  });

  test("widget ber-kind hanya di dashboard jenis itu", () => {
    const widgets: Widget[] = [
      kpi("f1", "finance"),
      { id: "fm", slot: "main", gate: [], kind: "finance", Component: Noop },
      { id: "um", slot: "main", gate: [], kind: "umum", Component: Noop },
      { id: "both", slot: "main", gate: [], Component: Noop },
    ];

    expect(ids(selectWidgets([], widgets, true).main)).toEqual(["fm", "both"]);
  });

  test("gateAny: cukup salah satu izin", () => {
    const widgets: Widget[] = [
      {
        id: "any",
        slot: "main",
        gate: [],
        gateAny: [
          { slug: MENU.KAS_KELUAR, action: "VIEW" },
          { slug: MENU.PAYROLL, action: "VIEW" },
        ],
        Component: Noop,
      },
    ];

    expect(ids(selectWidgets([], widgets, true).main)).toEqual([]);
    expect(
      ids(
        selectWidgets([domain([leaf(MENU.PAYROLL, ["VIEW"])])], widgets, true)
          .main,
      ),
    ).toEqual(["any"]);
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
    const { kind, kpi, main, side } = selectWidgets(
      menuOf(key),
      undefined,
      isDummyShown,
    );
    return { kind, kpi: ids(kpi), main: ids(main), side: ids(side) };
  };

  test("sekretariat: dashboard umum, tanpa angka keuangan", () => {
    const { kpi, main, side } = picked("sekretariat", true);

    // §10.4: jemaat → ibadah → kegiatan → ulang tahun → TTD → peminjaman,
    // maks 5; sekretariat tanpa PERMINTAAN_PERSETUJUAN.
    expect(kpi).toEqual([
      "kpi-jemaat-total",
      "kpi-services-week",
      "kpi-events-fortnight",
      "kpi-birthdays",
      "kpi-pending-loans",
    ]);
    expect(main).toEqual(["agenda-week", "zones"]);
    expect(side).toEqual([
      "birthdays",
      "announcements",
      "loan-rooms",
      "new-members",
      "my-offerings",
    ]);
  });

  test("bendahara: dashboard keuangan (§10.3)", () => {
    const { kind, kpi, main, side } = picked("bendahara", true);

    expect(kind).toBe("finance");
    expect(kpi).toEqual([
      "kpi-cash-balance",
      "kpi-income",
      "kpi-expense",
      "kpi-surplus-year",
      "kpi-payables",
    ]);
    expect(main).toEqual(["income-expense-chart", "payables"]);
    expect(side.slice(0, 4)).toEqual([
      "cash-accounts",
      "income-by-type",
      "closing-readiness",
      "agenda",
    ]);
    // Widget umum tidak ikut ke dashboard keuangan.
    expect(main).not.toContain("approvals");
    expect(side).not.toContain("zones");
  });

  test("majelis berizin laporan keuangan tetap mendapat strip umum (§10.1 #2)", () => {
    const { kind, kpi, main } = picked("majelis", true);

    expect(kind).toBe("umum");
    expect(kpi[0]).toBe("kpi-jemaat-total");
    expect(kpi).toContain("kpi-waiting-approvals");
    expect(main).toEqual(["agenda-week", "approvals", "zones"]);
    // Angka keuangannya tidak hilang: grafik hanya ada di dashboard keuangan,
    // jadi di sini tidak dirender.
    expect(main).not.toContain("income-expense-chart");
  });

  test("production: tidak ada widget dummy untuk persona mana pun", () => {
    const dummies = new Set(WIDGETS.filter((w) => w.isDummy).map((w) => w.id));

    for (const key of Object.keys(PERSONAS)) {
      const { kpi, main, side } = picked(key);
      expect(
        [...kpi, ...main, ...side].filter((id) => dummies.has(id)),
      ).toEqual([]);
    }
  });
});
