import { readDocumentCookie } from "@/lib/cookie";

import { BottomTab } from "./bottom-tab";
import { mainInset } from "./shell-width";
import { Sidebar } from "./sidebar";
import { SIDEBAR_COOKIE, isSidebarCollapsed } from "./sidebar-collapse";

interface PropTypes {
  children: React.ReactNode;
}

export const AppShell = (props: PropTypes) => {
  const { children } = props;

  const isCollapsed = isSidebarCollapsed(readDocumentCookie(SIDEBAR_COOKIE));

  return (
    <div className="bg-canvas-aurora flex min-h-dvh flex-col lg:flex-row">
      {/* iOS mengaburkan konten yang lewat di bawah status bar; lapisan solid
          ini membuat area itu bersih saat halaman di-scroll. */}
      <div
        aria-hidden
        className="bg-canvas fixed inset-x-0 top-0 z-50 h-[env(safe-area-inset-top)] lg:hidden print:hidden"
      />
      <Sidebar defaultCollapsed={isCollapsed} />

      <main className={`min-w-0 flex-1 ${mainInset} print:p-0`}>
        {children}
      </main>

      <BottomTab />
    </div>
  );
};
