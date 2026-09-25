export const SIDEBAR_COOKIE = "sidebar_collapsed";

export const isSidebarCollapsed = (value: string | undefined): boolean =>
  value === "1";

export const sidebarCookie = (isCollapsed: boolean): string =>
  `${SIDEBAR_COOKIE}=${isCollapsed ? "1" : "0"}; Path=/; Max-Age=31536000; SameSite=Lax`;

// Sama dengan transisi `left` gradasi kanvas di globals.css; ubah bersamaan.
export const SIDEBAR_MOTION =
  "duration-200 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none";
