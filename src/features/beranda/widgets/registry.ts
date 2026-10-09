import type { ComponentType } from "react";

import type { HeaderAction } from "@/components/layout";
import { MENU, type MenuSlug, createHref, menuHref } from "@/config/menu";
import { findMenuNode } from "@/lib/menu-tree";
import type { MenuAction, MenuNode } from "@/types/menu";

import { SHOW_DUMMY } from "../fixtures";
import {
  isViewPickable,
  KPI_GROUPS,
  type DashboardView,
  type KpiGroup,
} from "../view";

import { AgendaWidget } from "./agenda/agenda-widget";
import { AgendaWeekWidget } from "./agenda-week/agenda-week-widget";
import { KpiEventsFortnight } from "./agenda-week/kpi-events-fortnight";
import { KpiServicesWeek } from "./agenda-week/kpi-services-week";
import { ApprovalsWidget } from "./approvals/approvals-widget";
import { BudgetUseWidget } from "./dummy/budget-use-widget";
import { NewMembersWidget } from "./dummy/new-members-widget";
import { CashAccountsWidget } from "./finance/cash-accounts-widget";
import { ClosingReadinessWidget } from "./finance/closing-readiness-widget";
import { IncomeByTypeWidget } from "./finance/income-by-type-widget";
import { KpiCashBalance } from "./finance-kpi/kpi-cash-balance";
import { KpiExpense } from "./finance-kpi/kpi-expense";
import { KpiIncome } from "./finance-kpi/kpi-income";
import { KpiSurplusYear } from "./finance-kpi/kpi-surplus-year";
import { IncomeExpenseChart } from "./income-expense-chart/income-expense-chart";
import { BirthdaysWidget } from "./office/birthdays-widget";
import { KpiBirthdays } from "./office/kpi-birthdays";
import { KpiJemaatTotal } from "./office/kpi-jemaat-total";
import { KpiTodayLoans } from "./office/kpi-today-loans";
import { LoanRoomsWidget } from "./office/loan-rooms-widget";
import { KpiPayables } from "./payables/kpi-payables";
import { PayablesWidget } from "./payables/payables-widget";
import { AnnouncementsWidget } from "./personal/announcements-widget";
import { TugasSayaWidget } from "./tugas-saya/tugas-saya-widget";

export type WidgetSlot = "kpi" | "main" | "side";

export type WidgetGate = { slug: MenuSlug; action: MenuAction };

export type { KpiGroup };

export type Widget = {
  id: string;
  slot: WidgetSlot;
  gate: readonly WidgetGate[];
  gateAny?: readonly WidgetGate[];
  group?: KpiGroup;
  kind?: KpiGroup;
  isDummy?: boolean;
  Component: ComponentType;
};

const view = (slug: MenuSlug): WidgetGate => ({ slug, action: "VIEW" });

const CASH_DESK = [view(MENU.FINANCIAL_STATEMENT), view(MENU.KAS_KELUAR)];

const PAYABLE_SOURCES = [
  view(MENU.KAS_KELUAR),
  view(MENU.SUPPLIER_INVOICE),
  view(MENU.PAYROLL),
];

export const WIDGETS: readonly Widget[] = [
  {
    id: "kpi-cash-balance",
    slot: "kpi",
    group: "finance",
    gate: [view(MENU.FINANCIAL_STATEMENT)],
    isDummy: true,
    Component: KpiCashBalance,
  },
  {
    id: "kpi-income",
    slot: "kpi",
    group: "finance",
    gate: CASH_DESK,
    Component: KpiIncome,
  },
  {
    id: "kpi-expense",
    slot: "kpi",
    group: "finance",
    gate: CASH_DESK,
    Component: KpiExpense,
  },
  {
    id: "kpi-surplus-year",
    slot: "kpi",
    group: "finance",
    gate: [view(MENU.FINANCIAL_STATEMENT)],
    Component: KpiSurplusYear,
  },
  {
    id: "kpi-payables",
    slot: "kpi",
    group: "finance",
    gate: [],
    gateAny: PAYABLE_SOURCES,
    Component: KpiPayables,
  },

  {
    id: "kpi-jemaat-total",
    slot: "kpi",
    group: "umum",
    gate: [view(MENU.REPORT_JEMAAT)],
    Component: KpiJemaatTotal,
  },
  {
    id: "kpi-services-week",
    slot: "kpi",
    group: "umum",
    gate: [view(MENU.IBADAH)],
    Component: KpiServicesWeek,
  },
  {
    id: "kpi-events-fortnight",
    slot: "kpi",
    group: "umum",
    gate: [view(MENU.EVENT)],
    Component: KpiEventsFortnight,
  },
  {
    id: "kpi-birthdays",
    slot: "kpi",
    group: "umum",
    gate: [view(MENU.REPORT_JEMAAT)],
    Component: KpiBirthdays,
  },
  {
    id: "kpi-today-loans",
    slot: "kpi",
    group: "umum",
    gate: [view(MENU.PEMINJAMAN_RUANG)],
    Component: KpiTodayLoans,
  },

  {
    id: "income-expense-chart",
    slot: "main",
    kind: "finance",
    gate: [view(MENU.FINANCIAL_STATEMENT)],
    Component: IncomeExpenseChart,
  },
  {
    id: "payables",
    slot: "main",
    kind: "finance",
    gate: [],
    gateAny: [
      ...PAYABLE_SOURCES,
      view(MENU.APPROVAL_REQUEST),
      view(MENU.PAYMENT),
    ],
    Component: PayablesWidget,
  },
  {
    id: "budget-use",
    slot: "main",
    kind: "finance",
    gate: [view(MENU.BUDGET)],
    isDummy: true,
    Component: BudgetUseWidget,
  },

  {
    id: "agenda-week",
    slot: "main",
    kind: "umum",
    gate: [view(MENU.IBADAH)],
    Component: AgendaWeekWidget,
  },
  {
    id: "approvals",
    slot: "main",
    kind: "umum",
    gate: [view(MENU.APPROVAL_REQUEST)],
    Component: ApprovalsWidget,
  },

  {
    id: "cash-accounts",
    slot: "side",
    kind: "finance",
    gate: [view(MENU.FINANCIAL_STATEMENT)],
    isDummy: true,
    Component: CashAccountsWidget,
  },
  {
    id: "income-by-type",
    slot: "side",
    kind: "finance",
    gate: [view(MENU.FINANCIAL_STATEMENT)],
    Component: IncomeByTypeWidget,
  },
  {
    id: "closing-readiness",
    slot: "side",
    kind: "finance",
    gate: [view(MENU.FISCAL_PERIOD)],
    Component: ClosingReadinessWidget,
  },
  {
    id: "agenda",
    slot: "side",
    kind: "finance",
    gate: [view(MENU.IBADAH)],
    Component: AgendaWidget,
  },

  {
    id: "birthdays",
    slot: "side",
    gate: [view(MENU.REPORT_JEMAAT)],
    Component: BirthdaysWidget,
  },
  {
    id: "announcements",
    slot: "side",
    gate: [],
    Component: AnnouncementsWidget,
  },
  {
    id: "tugas-saya",
    slot: "side",
    gate: [],
    Component: TugasSayaWidget,
  },
  {
    id: "loan-rooms",
    slot: "side",
    gate: [view(MENU.PEMINJAMAN_RUANG)],
    Component: LoanRoomsWidget,
  },
  {
    id: "new-members",
    slot: "side",
    kind: "umum",
    gate: [view(MENU.REPORT_JEMAAT)],
    isDummy: true,
    Component: NewMembersWidget,
  },
];

export const MAX_KPI = 5;

export const isGranted = (menu: MenuNode[], { slug, action }: WidgetGate) =>
  findMenuNode(menu, slug)?.action.includes(action) ?? false;

export function selectWidgets(
  menu: MenuNode[],
  widgets: readonly Widget[] = WIDGETS,
  isDummyShown: boolean = SHOW_DUMMY,
  view?: DashboardView,
) {
  const allowed = widgets.filter(
    (widget) =>
      (isDummyShown || !widget.isDummy) &&
      widget.gate.every((gate) => isGranted(menu, gate)) &&
      (!widget.gateAny || widget.gateAny.some((gate) => isGranted(menu, gate))),
  );
  const kpiOf = (group: KpiGroup) =>
    allowed
      .filter((w) => w.slot === "kpi" && w.group === group)
      .slice(0, MAX_KPI);
  const finance = kpiOf("finance");
  const umum = kpiOf("umum");

  const groups = KPI_GROUPS.filter((group) => kpiOf(group).length > 0);
  const dominant: KpiGroup =
    finance.length > 0 && finance.length >= umum.length ? "finance" : "umum";

  const kind: DashboardView =
    isViewPickable(groups) && view && groups.includes(view) ? view : dominant;

  const of = (slot: WidgetSlot) =>
    allowed.filter((w) => w.slot === slot && (!w.kind || w.kind === kind));
  const main = of("main");
  const side = of("side");

  return {
    view: kind,
    groups,
    kpi: kind === "finance" ? finance : umum,
    main: main.length ? main : side.slice(0, 1),
    side: main.length ? side : side.slice(1),
  };
}

const HEADER_ACTIONS: readonly (HeaderAction & { gate: WidgetGate })[] = [
  {
    label: "Buka antrean persetujuan",
    href: menuHref(MENU.APPROVAL, MENU.APPROVAL_REQUEST),
    gate: view(MENU.APPROVAL_REQUEST),
  },
  {
    label: "Catat kas keluar",
    href: menuHref(MENU.FINANCE, MENU.KAS_KELUAR),
    gate: { slug: MENU.KAS_KELUAR, action: "CREATE" },
  },
  {
    label: "Input persembahan",
    href: menuHref(MENU.FINANCE, MENU.PERSEMBAHAN),
    gate: { slug: MENU.PERSEMBAHAN, action: "CREATE" },
  },
  {
    label: "Buat pengumuman",
    href: createHref(MENU.KEGIATAN, MENU.PENGUMUMAN),
    gate: { slug: MENU.PENGUMUMAN, action: "CREATE" },
  },
  {
    label: "Tambah jadwal ibadah",
    href: createHref(MENU.PERIBADAHAN, MENU.IBADAH),
    gate: { slug: MENU.IBADAH, action: "CREATE" },
  },
  {
    label: "Ajukan program",
    href: menuHref(MENU.BUDGETING, MENU.PROGRAM),
    gate: { slug: MENU.PROGRAM, action: "CREATE" },
  },
  {
    label: "Buat laporan pemakaian",
    href: menuHref(MENU.REPORT, MENU.BUDGET_REALIZATION),
    gate: { slug: MENU.BUDGET_REALIZATION, action: "CREATE" },
  },
];

export const selectHeaderActions = (menu: MenuNode[]): HeaderAction[] =>
  HEADER_ACTIONS.filter(({ gate }) => isGranted(menu, gate))
    .slice(0, 2)
    .map(({ label, href }) => ({ label, href }));
