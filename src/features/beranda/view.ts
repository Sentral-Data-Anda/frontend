export const KPI_GROUPS = ["finance", "umum"] as const;

export type KpiGroup = (typeof KPI_GROUPS)[number];

export type DashboardView = "all" | KpiGroup;

export const isViewPickable = (groups: readonly KpiGroup[]): boolean =>
  groups.length > 1;

export const DASHBOARD_VIEW_COOKIE = "dashboard_view";

export const VIEW_LABEL: Record<DashboardView, string> = {
  all: "Semua",
  finance: "Keuangan",
  umum: "Umum",
};

export const readDashboardView = (
  value: string | undefined,
): DashboardView | undefined =>
  value === "all" || KPI_GROUPS.includes(value as KpiGroup)
    ? (value as DashboardView)
    : undefined;

export const dashboardViewCookie = (view: DashboardView): string =>
  `${DASHBOARD_VIEW_COOKIE}=${view}; Path=/; Max-Age=31536000; SameSite=Lax`;

export const saveDashboardView = (view: DashboardView) => {
  document.cookie = dashboardViewCookie(view);
};
