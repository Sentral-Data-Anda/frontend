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
import { useSession } from "@/features/auth/session-provider";
import { findMenuNode } from "@/features/auth/use-menu-access";
import { cn } from "@/lib/utils";

type Tab = {
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

export function BottomTab() {
  const session = useSession();
  const pathname = usePathname();

  // Tab menuju layar yang tidak dipegang peran ini akan berujung 403 dari
  // be-sada. Menyaringnya di sini bukan keamanan — itu tetap milik be-sada —
  // melainkan menghindari jalan buntu yang terlihat seperti kerusakan.
  const tabs = TABS.filter(
    (tab) => tab.slug === null || findMenuNode(session.menu, tab.slug),
  );

  return (
    <nav
      aria-label="Navigasi utama"
      className="border-border bg-background sticky bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="flex">
        {tabs.map((tab) => {
          const isActive =
            tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);

          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex h-14 flex-col items-center justify-center gap-1 text-[11px]",
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
