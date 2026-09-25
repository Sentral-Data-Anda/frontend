import type { ComponentType } from "react";

import type { HeaderAction } from "@/components/layout";
import { MENU, type MenuSlug, menuHref } from "@/config/menu";
import { findMenuNode } from "@/lib/menu-tree";
import type { MenuAction, MenuNode } from "@/types/menu";

import { SHOW_DUMMY } from "../fixtures";
import {
  canPickView,
  KPI_GROUPS,
  type DashboardView,
  type KpiGroup,
} from "../view";

import { AgendaWidget } from "./agenda";
import {
  AgendaWeekWidget,
  KpiEventsFortnight,
  KpiServicesWeek,
} from "./agenda-week";
import { ApprovalsWidget, KpiWaitingApprovals } from "./approvals";
import { BudgetUseWidget, NewMembersWidget, ZonesWidget } from "./dummy";
import {
  CashAccountsWidget,
  ClosingReadinessWidget,
  IncomeByTypeWidget,
} from "./finance";
import {
  KpiCashBalance,
  KpiExpense,
  KpiIncome,
  KpiSurplusYear,
} from "./finance-kpi";
import { IncomeExpenseChart } from "./income-expense-chart";
import {
  BirthdaysWidget,
  KpiBirthdays,
  KpiJemaatTotal,
  KpiPendingLoans,
  LoanRoomsWidget,
} from "./office";
import { KpiPayables, PayablesWidget } from "./payables";
import { AnnouncementsWidget, MyOfferingsWidget } from "./personal";

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

const CASH_DESK = [view(MENU.LAPORAN_KEUANGAN), view(MENU.KAS_KELUAR)];

const PAYABLE_SOURCES = [
  view(MENU.KAS_KELUAR),
  view(MENU.FAKTUR_SUPPLIER),
  view(MENU.PAYROLL),
];

export const WIDGETS: readonly Widget[] = [
  {
    id: "kpi-cash-balance",
    slot: "kpi",
    group: "finance",
    gate: [view(MENU.LAPORAN_KEUANGAN)],
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
    gate: [view(MENU.LAPORAN_KEUANGAN)],
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
    id: "kpi-waiting-approvals",
    slot: "kpi",
    group: "umum",
    gate: [view(MENU.PERMINTAAN_PERSETUJUAN)],
    Component: KpiWaitingApprovals,
  },
  {
    id: "kpi-pending-loans",
    slot: "kpi",
    group: "umum",
    gate: [view(MENU.PEMINJAMAN_RUANG)],
    Component: KpiPendingLoans,
  },

  {
    id: "income-expense-chart",
    slot: "main",
    kind: "finance",
    gate: [view(MENU.LAPORAN_KEUANGAN)],
    Component: IncomeExpenseChart,
  },
  {
    id: "payables",
    slot: "main",
    kind: "finance",
    gate: [],
    gateAny: [
      ...PAYABLE_SOURCES,
      view(MENU.PERMINTAAN_PERSETUJUAN),
      view(MENU.PEMBAYARAN),
    ],
    Component: PayablesWidget,
  },
  {
    id: "budget-use",
    slot: "main",
    kind: "finance",
    gate: [view(MENU.PAGU_ANGGARAN)],
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
    gate: [view(MENU.PERMINTAAN_PERSETUJUAN)],
    Component: ApprovalsWidget,
  },
  {
    id: "zones",
    slot: "main",
    kind: "umum",
    gate: [view(MENU.REPORT_JEMAAT)],
    isDummy: true,
    Component: ZonesWidget,
  },

  {
    id: "cash-accounts",
    slot: "side",
    kind: "finance",
    gate: [view(MENU.LAPORAN_KEUANGAN)],
    isDummy: true,
    Component: CashAccountsWidget,
  },
  {
    id: "income-by-type",
    slot: "side",
    kind: "finance",
    gate: [view(MENU.LAPORAN_KEUANGAN)],
    Component: IncomeByTypeWidget,
  },
  {
    id: "closing-readiness",
    slot: "side",
    kind: "finance",
    gate: [view(MENU.PERIODE_FISKAL)],
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

export function selectWidgets(
  menu: MenuNode[],
  widgets: readonly Widget[] = WIDGETS,
  isDummyShown: boolean = SHOW_DUMMY,
  view?: DashboardView,
) {
  const allowed = widgets.filter(
    (widget) =>
      (isDummyShown || !widget.isDummy) &&
      widget.gate.every((gate) => hasGrant(menu, gate)) &&
      (!widget.gateAny || widget.gateAny.some((gate) => hasGrant(menu, gate))),
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

  const picked: DashboardView =
    canPickView(groups) && view && (view === "all" || groups.includes(view))
      ? view
      : dominant;

  const kind: KpiGroup = picked === "all" ? dominant : picked;

  const of = (slot: WidgetSlot) =>
    allowed.filter(
      (w) =>
        w.slot === slot && (picked === "all" || !w.kind || w.kind === picked),
    );
  const main = of("main");
  const side = of("side");

  return {
    kind,
    view: picked,
    groups,
    kpi: kind === "finance" ? finance : umum,
    main: main.length ? main : side.slice(0, 1),
    side: main.length ? side : side.slice(1),
  };
}

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
