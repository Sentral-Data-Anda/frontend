export const KPI_GROUPS = ["finance", "umum"] as const;

export type KpiGroup = (typeof KPI_GROUPS)[number];

// Dulu ada tampilan "Semua" yang menumpuk kedua grup; dicabut atas permintaan user,
// jadi tampilan dashboard selalu satu grup KPI.
export type DashboardView = KpiGroup;

export const isViewPickable = (groups: readonly KpiGroup[]): boolean =>
  groups.length > 1;

export const DASHBOARD_VIEW_COOKIE = "dashboard_view";

export const VIEW_LABEL: Record<DashboardView, string> = {
  finance: "Keuangan",
  umum: "Umum",
};

/** The stored role value, mapped to the view the widgets already speak. */
export const viewOfRole = (
  dashboardView: "UMUM" | "KEUANGAN",
): DashboardView => (dashboardView === "KEUANGAN" ? "finance" : "umum");

export const readDashboardView = (
  value: string | undefined,
): DashboardView | undefined =>
  KPI_GROUPS.includes(value as KpiGroup) ? (value as DashboardView) : undefined;

export const dashboardViewCookie = (view: DashboardView): string =>
  `${DASHBOARD_VIEW_COOKIE}=${view}; Path=/; Max-Age=31536000; SameSite=Lax`;

export const saveDashboardView = (view: DashboardView) => {
  document.cookie = dashboardViewCookie(view);
};
