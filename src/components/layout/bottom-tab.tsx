"use client";

import {
  BookOpen,
  CalendarDays,
  House,
  Megaphone,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { MENU, isFormRoute, menuHref } from "@/config/menu";
import { useSession } from "@/features/auth";
import { findMenuNode } from "@/lib/menu-tree";
import { cn } from "@/lib/utils";
import type { MenuNode } from "@/types/menu";

export type Tab = {
  label: string;
  href: string;
  icon: LucideIcon;
  slug: string | null;
};

const TABS: Tab[] = [
  { label: "Dashboard", href: "/", icon: House, slug: null },
  {
    label: "Ibadah",
    href: menuHref(MENU.PERIBADAHAN, MENU.IBADAH),
    icon: BookOpen,
    slug: MENU.IBADAH,
  },
  {
    label: "Pelayanan",
    href: menuHref(MENU.PELAYANAN, MENU.JADWAL_PELAYAN),
    icon: CalendarDays,
    slug: MENU.JADWAL_PELAYAN,
  },
  {
    label: "Warta",
    href: menuHref(MENU.KEGIATAN, MENU.PENGUMUMAN),
    icon: Megaphone,
    slug: MENU.PENGUMUMAN,
  },
];

export function getVisibleTabs(tabs: Tab[], menu: MenuNode[]): Tab[] {
  return tabs.filter(
    (tab) => tab.slug === null || findMenuNode(menu, tab.slug),
  );
}

export function isTabActive(href: string, pathname: string): boolean {
  return href === "/"
    ? pathname === "/"
    : pathname === href || pathname.startsWith(`${href}/`);
}

export const BottomTab = () => {
  const session = useSession();
  const pathname = usePathname();

  if (isFormRoute(pathname)) return null;

  const tabs = getVisibleTabs(TABS, session.menu);

  return (
    <nav
      aria-label="Navigasi utama"
      className="border-border bg-card sticky bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)] lg:hidden print:hidden"
    >
      <ul className="flex">
        {tabs.map((tab) => {
          const isActive = isTabActive(tab.href, pathname);

          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "hover:text-foreground active:bg-muted flex h-(--bottom-tab-height) flex-col items-center justify-center gap-1 text-body transition-colors",
                  isActive
                    ? "text-foreground font-medium"
                    : "text-muted-foreground",
                )}
              >
                <tab.icon className="size-5" aria-hidden />
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
