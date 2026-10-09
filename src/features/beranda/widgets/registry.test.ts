import { describe, expect, test } from "bun:test";

import { MENU } from "@/config/menu";
import type { MenuNode } from "@/types/menu";

import { TREE } from "../../../../scripts/menu-tree";
import { actionsOf, PERSONAS } from "../../../../scripts/mock-dashboard";
import type { DashboardView } from "../view";

import {
  MAX_KPI,
  selectHeaderActions,
  selectWidgets,
  WIDGETS,
  type KpiGroup,
  type Widget,
} from "./registry";

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
        { slug: MENU.FINANCIAL_STATEMENT, action: "VIEW" },
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
        leaf(MENU.FINANCIAL_STATEMENT, ["VIEW"]),
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

    expect(picked.view).toBe("umum");
    expect(ids(picked.kpi)).toEqual(["u1", "u2"]);
  });

  test("seri → finance; dihitung setelah batas MAX_KPI", () => {
    const widgets = [
      ...Array.from({ length: 5 }, (_, i) => kpi(`f${i}`, "finance")),
      ...Array.from({ length: 6 }, (_, i) => kpi(`u${i}`, "umum")),
    ];

    expect(selectWidgets([], widgets, true).view).toBe("finance");
  });

  test("widget ber-kind hanya di tampilan jenis itu", () => {
    const widgets: Widget[] = [
      kpi("f1", "finance"),
      kpi("u1", "umum"),
      { id: "fm", slot: "main", gate: [], kind: "finance", Component: Noop },
      { id: "um", slot: "main", gate: [], kind: "umum", Component: Noop },
      { id: "both", slot: "main", gate: [], Component: Noop },
    ];

    expect(ids(selectWidgets([], widgets, true).main)).toEqual(["fm", "both"]);
    expect(ids(selectWidgets([], widgets, true, "umum").main)).toEqual([
      "um",
      "both",
    ]);
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
  const menuOf = (key: string): MenuNode[] =>
    Object.entries(TREE).flatMap(([slug, leaves]) => {
      const children = leaves.flatMap((child) => {
        const action = actionsOf(PERSONAS[key], child);
        return action.length ? [leaf(child, action)] : [];
      });
      return children.length ? [{ ...leaf(slug, []), children }] : [];
    });

  const picked = (key: string, isDummyShown = false, view?: DashboardView) => {
    const {
      view: picked,
      groups,
      kpi,
      main,
      side,
    } = selectWidgets(menuOf(key), undefined, isDummyShown, view);
    return {
      kind: picked,
      groups,
      kpi: ids(kpi),
      main: ids(main),
      side: ids(side),
    };
  };

  test("sekretariat: dashboard umum, tanpa angka keuangan", () => {
    const { kpi, main, side } = picked("sekretariat", true);

    expect(kpi).toEqual([
      "kpi-jemaat-total",
      "kpi-services-week",
      "kpi-events-fortnight",
      "kpi-birthdays",
      "kpi-today-loans",
    ]);
    expect(main).toEqual(["agenda-week"]);
    expect(side).toEqual([
      "tugas-saya",
      "loan-rooms",
      "announcements",
      "jemaat",
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
    // `budget-use` masuk karena bendahara kini memegang BUDGET
    // (keputusan user: pagu milik majelis DAN bendahara). Widget-nya masih
    // `isDummy`, jadi ia hanya tampil di luar production.
    expect(main).toEqual(["payables", "income-expense-chart", "budget-use"]);
    expect(main).not.toContain("agenda-week");
    expect(side.slice(0, 3)).toEqual([
      "closing-readiness",
      "cash-accounts",
      "income-by-type",
    ]);

    const keuangan = picked("bendahara", true, "finance");

    expect(keuangan.main).toEqual([
      "payables",
      "income-expense-chart",
      "budget-use",
    ]);
    expect(keuangan.main).not.toContain("agenda-week");
  });

  test("majelis berizin laporan keuangan tetap mendapat strip umum (§10.1 #2)", () => {
    const { kind, kpi, main } = picked("majelis", true);

    expect(kind).toBe("umum");
    expect(kpi[0]).toBe("kpi-jemaat-total");
    expect(main).toContain("agenda-week");
    expect(main).toContain("approvals");

    const umum = picked("majelis", true, "umum");

    expect(umum.main).toEqual(["approvals", "agenda-week"]);
    expect(umum.main).not.toContain("income-expense-chart");
  });

  test("hanya persona multi-grup yang mendapat pilihan tampilan", () => {
    expect(picked("sekretariat", true).groups).toEqual(["umum"]);
    expect(picked("admin", true).groups).toEqual(["finance", "umum"]);
    expect(picked("bendahara", true).groups).toEqual(["finance", "umum"]);
  });

  test("tugas saya: tanpa gerbang, kartu sisi pertama tanpa kind, di sisi semua persona", () => {
    const sideIds = WIDGETS.filter((w) => w.slot === "side" && !w.kind).map(
      (w) => w.id,
    );
    const tugas = WIDGETS.find((w) => w.id === "tugas-saya");

    expect(tugas?.gate).toEqual([]);
    expect(tugas?.gateAny).toBeUndefined();
    // Urutan baca: tugas pribadi dulu, baru jadwal, baru bacaan.
    expect(sideIds).toEqual([
      "tugas-saya",
      "loan-rooms",
      "announcements",
      "jemaat",
    ]);

    // Persona tanpa widget main sama sekali menaikkan kartu sisi pertama ke main,
    // jadi tugas-saya selalu tampil, hanya kolomnya yang bisa berbeda.
    for (const key of Object.keys(PERSONAS)) {
      const { main, side } = picked(key);
      expect([...main, ...side]).toContain("tugas-saya");
    }
  });

  test("operator dan koordinator: kartu sisi pertama naik ke main", () => {
    for (const key of ["operator", "koordinator"]) {
      const { main, side } = picked(key);
      expect(main).toEqual(["tugas-saya"]);
      expect(side).toEqual(["announcements"]);
    }
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

describe("selectWidgets: pilihan tampilan", () => {
  const menu = [
    domain([
      leaf(MENU.FINANCIAL_STATEMENT, ["VIEW"]),
      leaf(MENU.KAS_KELUAR, ["VIEW"]),
      leaf(MENU.IBADAH, ["VIEW"]),
    ]),
  ];
  const widgets: Widget[] = [
    { ...widget("kpi-uang", "kpi"), group: "finance" },
    { ...widget("kpi-acara", "kpi"), group: "umum" },
    { ...widget("grafik", "main"), kind: "finance" },
    { ...widget("agenda", "main"), kind: "umum" },
    widget("pengumuman", "side"),
  ];

  test("bawaan: grup dominan, bukan gabungan", () => {
    const bawaan = selectWidgets(menu, widgets, true);

    expect(bawaan.view).toBe("finance");
    expect(ids(bawaan.main)).toEqual(["grafik"]);
  });

  test("satu grup: widget dan KPI grup itu, plus widget tanpa kind", () => {
    const uang = selectWidgets(menu, widgets, true, "finance");

    expect(ids(uang.main)).toEqual(["grafik"]);
    expect(ids(uang.kpi)).toEqual(["kpi-uang"]);
    expect(ids(uang.side)).toEqual(["pengumuman"]);

    const acara = selectWidgets(menu, widgets, true, "umum");

    expect(ids(acara.main)).toEqual(["agenda"]);
    expect(ids(acara.kpi)).toEqual(["kpi-acara"]);
  });

  test("grup diturunkan dari sel KPI yang dipegang, bukan daftar tetap", () => {
    expect(selectWidgets(menu, widgets, true).groups).toEqual([
      "finance",
      "umum",
    ]);

    const satuGrup = widgets.filter((w) => w.id !== "kpi-acara");

    expect(selectWidgets(menu, satuGrup, true).groups).toEqual(["finance"]);
  });

  test("user tanpa dropdown: cookie tidak menyaring apa pun", () => {
    const satuGrup = widgets.filter((w) => w.id !== "kpi-acara");
    const bawaan = selectWidgets(menu, satuGrup, true);

    for (const view of ["finance", "umum"] as const) {
      const hasil = selectWidgets(menu, satuGrup, true, view);

      expect(hasil.view).toBe(bawaan.view);
      expect(ids(hasil.main)).toEqual(ids(bawaan.main));
      expect(ids(hasil.kpi)).toEqual(ids(bawaan.kpi));
    }
  });
});

describe("selectHeaderActions", () => {
  test("tambah jadwal ibadah langsung membuka form tambah ibadah", () => {
    const menu = [domain([leaf(MENU.IBADAH, ["VIEW", "CREATE"])])];

    expect(selectHeaderActions(menu)).toEqual([
      { label: "Tambah jadwal ibadah", href: "/peribadahan/ibadah/baru" },
    ]);
  });

  test("buat pengumuman langsung membuka form tambah pengumuman", () => {
    const menu = [domain([leaf(MENU.PENGUMUMAN, ["VIEW", "CREATE"])])];

    expect(selectHeaderActions(menu)).toEqual([
      { label: "Buat pengumuman", href: "/kegiatan/pengumuman/baru" },
    ]);
  });
});
