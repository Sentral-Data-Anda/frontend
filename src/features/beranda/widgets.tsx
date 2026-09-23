import type { ComponentType } from "react";

import type { HeaderAction } from "@/components/layout/dashboard-header";
import { MENU, type MenuSlug, menuHref } from "@/config/menu";
import { findMenuNode } from "@/features/auth/menu-tree";
import type { MenuAction, MenuNode } from "@/features/auth/types";

import { AgendaWidget } from "./agenda";
import {
  AgendaWeekWidget,
  KpiEventsFortnight,
  KpiServicesWeek,
} from "./agenda-week";
import { ApprovalsWidget, KpiWaitingApprovals } from "./approvals";
import {
  canPickView,
  KPI_GROUPS,
  type DashboardView,
  type KpiGroup,
} from "./dashboard-view";
import { SHOW_DUMMY } from "./dummy";
import {
  BudgetUseWidget,
  NewMembersWidget,
  ZonesWidget,
} from "./dummy-widgets";
import {
  KpiCashBalance,
  KpiExpense,
  KpiIncome,
  KpiSurplusYear,
} from "./finance-kpi";
import {
  CashAccountsWidget,
  ClosingReadinessWidget,
  IncomeByTypeWidget,
} from "./finance-widgets";
import { IncomeExpenseChart } from "./income-expense-chart";
import {
  BirthdaysWidget,
  KpiBirthdays,
  KpiJemaatTotal,
  KpiPendingLoans,
  LoanRoomsWidget,
} from "./office-widgets";
import { KpiPayables, PayablesWidget } from "./payables";
import { AnnouncementsWidget, MyOfferingsWidget } from "./personal-widgets";

export type WidgetSlot = "kpi" | "main" | "side";

export type WidgetGate = { slug: MenuSlug; action: MenuAction };

/**
 * Grup KPI — satu strip tidak pernah mencampur keduanya (§10.1 #2), dan grup
 * yang sama menjadi pilihan dropdown tampilan (`dashboard-view.ts`).
 */
export type { KpiGroup };

/**
 * Satu widget Beranda.
 *
 * - `gate`: guard endpoint yang dibacanya — SEMUA harus dipegang (kosong =
 *   setiap user).
 * - `gateAny`: cukup SALAH SATU (widget gabungan beberapa sumber, mis.
 *   "Perlu diselesaikan"; tiap bagian di dalamnya memakai gate sendiri).
 * - `group`: grup KPI (hanya slot `kpi`).
 * - `kind`: hanya di dashboard jenis itu (lihat `selectWidgets`); tanpa
 *   `kind` = keduanya.
 * - `isDummy`: datanya fixture FE (`dummy.ts`) karena endpoint-nya belum ada
 *   di be-sada — tidak pernah dirender di production.
 *
 * Widget mengambil datanya sendiri, jadi kontraknya seragam: gate lolos →
 * render `Component`, tanpa props.
 */
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

/**
 * Pengelola kas harian (`LAPORAN_KEUANGAN` + `KAS_KELUAR`): rincian saldo,
 * masuk, keluar. Pemegang laporan saja (mis. majelis) mendapat ringkasan.
 */
const CASH_DESK = [view(MENU.LAPORAN_KEUANGAN), view(MENU.KAS_KELUAR)];

/** Sumber kewajiban "Perlu dibayar" (§10.3): cukup salah satu. */
const PAYABLE_SOURCES = [
  view(MENU.KAS_KELUAR),
  view(MENU.FAKTUR_SUPPLIER),
  view(MENU.PAYROLL),
];

/**
 * Urutan di sini = urutan tampil di slotnya (dashboard-desktop.md §4:
 * tindakan → uang → jadwal → pribadi). KPI dibatasi `MAX_KPI` sel.
 */
export const WIDGETS: readonly Widget[] = [
  // ---- KPI keuangan (§10.3) -------------------------------------------
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

  // ---- KPI umum (§10.4), urut: jemaat → ibadah → kegiatan → ulang tahun
  //      → menunggu TTD → peminjaman ---------------------------------------
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

  // ---- Main: keuangan --------------------------------------------------
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

  // ---- Main: umum ------------------------------------------------------
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

  // ---- Samping: keuangan ----------------------------------------------
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

  // ---- Samping: keduanya (urutan §10.3/§10.4) --------------------------
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

/**
 * Widget yang boleh tampil untuk pohon menu ini, per slot. Dipanggil di
 * layar (bukan `return null` di dalam widget) karena grid harus tahu slot
 * mana yang kosong sebelum render.
 *
 * `view` adalah pilihan TAMPILAN user (dropdown di kepala dashboard), bukan
 * izin:
 *
 * - tanpa pilihan (belum pernah memilih) — **grup dominan**: grup dengan sel
 *   KPI lolos-gate terbanyak (dihitung setelah `MAX_KPI`; seri → finance).
 *   Itu halaman terpendek yang masuk akal, dan yang membuatnya bisa dibuka
 *   sekarang adalah dropdown-nya sendiri.
 * - `"all"` — semua widget yang lolos gate. Strip KPI tetap tidak dicampur:
 *   isinya grup dominan.
 * - satu grup — strip KPI grup itu, dan hanya widget ber-`kind` grup itu
 *   ditambah widget tanpa `kind` (yang berlaku di tampilan mana pun).
 *
 * Pilihan hanya diberlakukan bila user memang punya dropdown-nya
 * (`canPickView`) dan memegang grup yang dipilih. Kalau tidak, pilihan
 * tersimpan diabaikan: user tanpa dropdown tidak boleh terjebak di tampilan
 * yang tidak bisa ia ubah kembali.
 *
 * Main kosong → widget samping pertama naik ke main, supaya kolom utama
 * tidak pernah kosong di samping kolom samping.
 */
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

  // Grup dihitung dari sel KPI-nya, bukan dari widget mana pun yang kebetulan
  // ber-`kind`: sekretariat memegang satu widget keuangan kecil (Agenda),
  // tapi "tampilan Keuangan" tanpa satu angka pun bukan tampilan.
  const groups = KPI_GROUPS.filter((group) => kpiOf(group).length > 0);
  const dominant: KpiGroup =
    finance.length > 0 && finance.length >= umum.length ? "finance" : "umum";

  // Pilihan hanya diberlakukan untuk user yang PUNYA dropdown (syarat yang
  // sama, `canPickView`), dan grup yang tidak dipegangnya diabaikan. Tanpa
  // pilihan tersimpan: grup dominan — tampilan terpendek yang masuk akal.
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
    /** Tampilan yang benar-benar dipakai (bisa berbeda dari `view`). */
    view: picked,
    /** Grup yang dipegang user — pilihan dropdown dibangun dari ini. */
    groups,
    kpi: kind === "finance" ? finance : umum,
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
