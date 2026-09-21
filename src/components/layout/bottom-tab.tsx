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

import { MENU, menuHref } from "@/config/menu";
import { findMenuNode } from "@/features/auth/menu-tree";
import { useSession } from "@/features/auth/session-provider";
import type { MenuNode } from "@/features/auth/types";
import { cn } from "@/lib/utils";

export type Tab = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Slug yang harus dipegang peran agar tab ini tampil. Null = selalu tampil. */
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

/**
 * Tab menuju layar yang tidak dipegang peran ini akan berujung 403 dari
 * be-sada. Menyaringnya di sini bukan keamanan — itu tetap milik be-sada —
 * melainkan menghindari jalan buntu yang terlihat seperti kerusakan.
 *
 * `tab.slug === null` diperiksa LEBIH DULU: tab seperti "Dashboard" harus
 * selalu tampil dan tidak pernah dicari di pohon menu. Membalik urutan
 * operan `||` di sini akan tetap benar secara logika, tapi ekstraksi ini ada
 * justru supaya urutannya bisa diuji, bukan cuma dibaca.
 */
export function getVisibleTabs(tabs: Tab[], menu: MenuNode[]): Tab[] {
  return tabs.filter(
    (tab) => tab.slug === null || findMenuNode(menu, tab.slug),
  );
}

/** `/` dicocokkan persis; rute lain dicocokkan lewat `startsWith`. */
export function isTabActive(href: string, pathname: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function BottomTab() {
  const session = useSession();
  const pathname = usePathname();

  const tabs = getVisibleTabs(TABS, session.menu);

  return (
    <nav
      aria-label="Navigasi utama"
      className="border-border bg-card sticky bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)] lg:hidden"
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
                  "flex h-(--bottom-tab-height) flex-col items-center justify-center gap-1 text-caption",
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
}
