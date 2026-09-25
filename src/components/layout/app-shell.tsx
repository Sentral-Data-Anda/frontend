import { cookies } from "next/headers";

import { BottomTab } from "./bottom-tab";
import { Sidebar } from "./sidebar";
import { SIDEBAR_COOKIE, isSidebarCollapsed } from "./sidebar-collapse";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const isCollapsed = isSidebarCollapsed(
    cookieStore.get(SIDEBAR_COOKIE)?.value,
  );

  return (
    <div className="bg-canvas-aurora flex min-h-dvh flex-col lg:flex-row">
      <Sidebar defaultCollapsed={isCollapsed} />

      <main className="min-w-0 flex-1 lg:pl-3.5">{children}</main>

      <BottomTab />
    </div>
  );
}
