import type { ComponentType } from "react";

import type { HeaderAction } from "@/components/layout/dashboard-header";
import { MENU, type MenuSlug, menuHref } from "@/config/menu";
import { findMenuNode } from "@/features/auth/menu-tree";
import type { MenuAction, MenuNode } from "@/features/auth/types";

import { AgendaWidget, KpiAgendaWeek } from "./agenda";
import { ApprovalsWidget, KpiWaitingApprovals } from "./approvals";
import { SHOW_DUMMY } from "./dummy";
import {
  BookkeepingWidget,
  BudgetUseWidget,
  KpiBudgetHigh,
  MyDutiesWidget,
} from "./dummy-widgets";
import { IncomeExpenseChart } from "./income-expense-chart";
import {
  KpiExpense,
  KpiIncome,
  KpiSurplusMonth,
  KpiSurplusYear,
  KpiTotalAssets,
} from "./kpi";
import {
  BirthdaysWidget,
  CashExpenseWidget,
  KpiBirthdays,
  KpiPendingLoans,
  LoanRoomsWidget,
} from "./office-widgets";
import { AnnouncementsWidget, MyOfferingsWidget } from "./personal-widgets";

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
    id: "kpi-total-assets",
    slot: "kpi",
    gate: CASH_DESK,
    Component: KpiTotalAssets,
  },
  { id: "kpi-income", slot: "kpi", gate: CASH_DESK, Component: KpiIncome },
  { id: "kpi-expense", slot: "kpi", gate: CASH_DESK, Component: KpiExpense },
  {
    id: "kpi-surplus-month",
    slot: "kpi",
    gate: CASH_DESK,
    Component: KpiSurplusMonth,
  },
  {
    id: "kpi-waiting-approvals",
    slot: "kpi",
    gate: [view(MENU.PERMINTAAN_PERSETUJUAN)],
    Component: KpiWaitingApprovals,
  },
  {
    id: "kpi-surplus-year",
    slot: "kpi",
    gate: [view(MENU.LAPORAN_KEUANGAN)],
    Component: KpiSurplusYear,
  },
  {
    id: "kpi-budget-high",
    slot: "kpi",
    gate: [view(MENU.PAGU_ANGGARAN)],
    isDummy: true,
    Component: KpiBudgetHigh,
  },
  {
    id: "kpi-agenda-week",
    slot: "kpi",
    gate: [view(MENU.IBADAH)],
    Component: KpiAgendaWeek,
  },
  {
    id: "kpi-pending-loans",
    slot: "kpi",
    gate: [view(MENU.PEMINJAMAN_RUANG)],
    Component: KpiPendingLoans,
  },
  {
    id: "kpi-birthdays",
    slot: "kpi",
    gate: [view(MENU.REPORT_JEMAAT)],
    Component: KpiBirthdays,
  },

  {
    id: "approvals",
    slot: "main",
    gate: [view(MENU.PERMINTAAN_PERSETUJUAN)],
    Component: ApprovalsWidget,
  },
  {
    id: "income-expense-chart",
    slot: "main",
    gate: [view(MENU.LAPORAN_KEUANGAN)],
    Component: IncomeExpenseChart,
  },
  {
    id: "cash-expense",
    slot: "main",
    gate: [view(MENU.KAS_KELUAR)],
    Component: CashExpenseWidget,
  },
  {
    id: "budget-use",
    slot: "main",
    gate: [view(MENU.PAGU_ANGGARAN)],
    isDummy: true,
    Component: BudgetUseWidget,
  },
  {
    id: "bookkeeping",
    slot: "main",
    gate: [view(MENU.PERIODE_FISKAL)],
    isDummy: true,
    Component: BookkeepingWidget,
  },

  // Agenda menjadi main untuk peran tanpa widget main (sekretariat).
  {
    id: "agenda",
    slot: "side",
    gate: [view(MENU.IBADAH)],
    Component: AgendaWidget,
  },
  {
    id: "loan-rooms",
    slot: "side",
    gate: [view(MENU.PEMINJAMAN_RUANG)],
    Component: LoanRoomsWidget,
  },
  {
    id: "birthdays",
    slot: "side",
    gate: [view(MENU.REPORT_JEMAAT)],
    Component: BirthdaysWidget,
  },
  {
    id: "my-duties",
    slot: "side",
    gate: [],
    isDummy: true,
    Component: MyDutiesWidget,
  },
  {
    id: "announcements",
    slot: "side",
    gate: [],
    Component: AnnouncementsWidget,
  },
  {
    id: "my-offerings",
    slot: "side",
    gate: [],
    Component: MyOfferingsWidget,
  },
];

export const MAX_KPI = 5;

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

/**
 * Aksi utama di kepala dashboard (≥ lg), maks 2, dari izin CREATE/VIEW
 * layarnya. Urutan = prioritas BA §4: persetujuan → keuangan → sekretariat →
 * komisi; user berizin gabungan mendapat dua yang teratas.
 */
const HEADER_ACTIONS: readonly (HeaderAction & { gate: WidgetGate })[] = [
  {
    label: "Buka antrean persetujuan",
    href: menuHref(MENU.PERSETUJUAN, MENU.PERMINTAAN_PERSETUJUAN),
    gate: view(MENU.PERMINTAAN_PERSETUJUAN),
  },
  {
    label: "Catat kas keluar",
    href: menuHref(MENU.KEUANGAN, MENU.KAS_KELUAR),
    gate: { slug: MENU.KAS_KELUAR, action: "CREATE" },
  },
  {
    label: "Input persembahan",
    href: menuHref(MENU.KEUANGAN, MENU.PERSEMBAHAN),
    gate: { slug: MENU.PERSEMBAHAN, action: "CREATE" },
  },
  {
    label: "Buat pengumuman",
    href: menuHref(MENU.KEGIATAN, MENU.PENGUMUMAN),
    gate: { slug: MENU.PENGUMUMAN, action: "CREATE" },
  },
  {
    label: "Tambah jadwal ibadah",
    href: menuHref(MENU.PERIBADAHAN, MENU.IBADAH),
    gate: { slug: MENU.IBADAH, action: "CREATE" },
  },
  {
    label: "Ajukan program",
    href: menuHref(MENU.ANGGARAN, MENU.PROGRAM),
    gate: { slug: MENU.PROGRAM, action: "CREATE" },
  },
  {
    label: "Buat laporan pemakaian",
    href: menuHref(MENU.ANGGARAN, MENU.LAPORAN_BUDGET),
    gate: { slug: MENU.LAPORAN_BUDGET, action: "CREATE" },
  },
];

export const selectHeaderActions = (menu: MenuNode[]): HeaderAction[] =>
  HEADER_ACTIONS.filter(({ gate }) => hasGrant(menu, gate))
    .slice(0, 2)
    .map(({ label, href }) => ({ label, href }));
