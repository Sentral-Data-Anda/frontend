import type { ComponentType } from "react";

import { MENU, type MenuSlug } from "@/config/menu";
import { findMenuNode } from "@/features/auth/menu-tree";
import type { MenuAction, MenuNode } from "@/features/auth/types";

import { SHOW_DUMMY } from "./dummy";
import { KpiCashBalance, KpiExpense, KpiIncome } from "./kpi";
import { TodaySchedule } from "./today-schedule";

export type WidgetSlot = "kpi" | "main" | "side";

export type WidgetGate = { slug: MenuSlug; action: MenuAction };

/**
 * Satu widget Beranda. `gate` = guard endpoint yang dibacanya (semua harus
 * dipegang; kosong = setiap user). Widget mengambil datanya sendiri, jadi
 * kontraknya seragam: gate lolos → render `Component`, tanpa props.
 *
 * `isDummy`: datanya fixture FE (`dummy.ts`) karena endpoint-nya belum ada di
 * be-sada — tidak pernah dirender di production.
 */
export type Widget = {
  id: string;
  slot: WidgetSlot;
  gate: readonly WidgetGate[];
  isDummy?: boolean;
  Component: ComponentType;
};

const view = (slug: MenuSlug): WidgetGate => ({ slug, action: "VIEW" });

/**
 * Pengelola kas harian (`LAPORAN_KEUANGAN` + `KAS_KELUAR`): rincian saldo,
 * masuk, keluar. Pemegang laporan saja (mis. majelis) mendapat ringkasan.
 */
const CASH_DESK = [view(MENU.LAPORAN_KEUANGAN), view(MENU.KAS_KELUAR)];

/**
 * Urutan di sini = urutan tampil di slotnya (dashboard-desktop.md §4:
 * tindakan → uang → jadwal → pribadi). KPI dibatasi `MAX_KPI` sel.
 */
export const WIDGETS: readonly Widget[] = [
  {
    id: "kpi-cash-balance",
    slot: "kpi",
    gate: CASH_DESK,
    isDummy: true,
    Component: KpiCashBalance,
  },
  {
    id: "kpi-income",
    slot: "kpi",
    gate: CASH_DESK,
    isDummy: true,
    Component: KpiIncome,
  },
  {
    id: "kpi-expense",
    slot: "kpi",
    gate: CASH_DESK,
    isDummy: true,
    Component: KpiExpense,
  },
  {
    id: "today-schedule",
    slot: "side",
    gate: [view(MENU.IBADAH)],
    Component: TodaySchedule,
  },
];

export const MAX_KPI = 4;

export const hasGrant = (menu: MenuNode[], { slug, action }: WidgetGate) =>
  findMenuNode(menu, slug)?.action.includes(action) ?? false;

/**
 * Widget yang boleh tampil untuk pohon menu ini, per slot. Dipanggil di
 * layar (bukan `return null` di dalam widget) karena grid harus tahu slot
 * mana yang kosong sebelum render.
 *
 * Main kosong (mis. sekretariat) → widget samping pertama naik ke main,
 * supaya kolom utama tidak pernah kosong di samping kolom samping.
 */
export function selectWidgets(
  menu: MenuNode[],
  widgets: readonly Widget[] = WIDGETS,
  isDummyShown: boolean = SHOW_DUMMY,
) {
  const allowed = widgets.filter(
    (widget) =>
      (isDummyShown || !widget.isDummy) &&
      widget.gate.every((gate) => hasGrant(menu, gate)),
  );
  const of = (slot: WidgetSlot) => allowed.filter((w) => w.slot === slot);
  const main = of("main");
  const side = of("side");

  return {
    kpi: of("kpi").slice(0, MAX_KPI),
    main: main.length ? main : side.slice(0, 1),
    side: main.length ? side : side.slice(1),
  };
}
