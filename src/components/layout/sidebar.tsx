"use client";

import { ChevronDown, House, Search, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { Avatar } from "@/components/common/avatar";
import { MENU_ICON, domainHref, menuHref } from "@/config/menu";
import { useSession } from "@/features/auth/session-provider";
import type { MenuNode } from "@/features/auth/types";
import { cn } from "@/lib/utils";

import { AppIdentity } from "./app-identity";
import { isTabActive } from "./bottom-tab";
import { LogoutButton } from "./logout-button";

// Offset 2px: ring selalu berbatasan dengan navy (5.20:1), termasuk di
// sekeliling chip aktif yang terang.
const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar-ring";

const ITEM = cn(
  "flex h-control items-center gap-3 rounded-control px-3 transition-colors",
  FOCUS,
);

// Hover memutihkan teks: p200 di atas accent p800 hanya 3.82:1.
const IDLE = "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";

const ACTIVE = "bg-sidebar-primary text-sidebar-primary-foreground font-medium";

/**
 * Seluruh chrome global desktop (≥ lg) — tidak ada top bar. Identitas di
 * atas dan pengguna + Keluar di bawah diam; hanya navigasi di tengah yang
 * scroll, supaya 1024×768 dengan domain Keuangan (11 layar) terbuka tidak
 * memotong apa pun.
 */
export function Sidebar() {
  const session = useSession();
  const pathname = usePathname();
  const name = session.jemaat?.name ?? session.username;
  const ref = useRef<HTMLElement>(null);

  // Di 1024×768 layar ke-11 Keuangan ada di bawah lipatan navigasi.
  useEffect(() => {
    ref.current
      ?.querySelector('nav [aria-current="page"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [pathname]);

  return (
    <aside
      ref={ref}
      className="bg-sidebar text-sidebar-foreground sticky top-0 hidden h-dvh w-64 shrink-0 flex-col lg:flex"
    >
      <div className="border-sidebar-border border-b px-4 py-4">
        <AppIdentity role={session.roleUser.name} tone="sidebar" />
      </div>

      <SidebarNav menu={session.menu} pathname={pathname} />

      <div className="border-sidebar-border flex items-center gap-3 border-t px-4 py-3">
        <Avatar label={name} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-body font-medium">{name}</p>
          <p className="text-sidebar-muted-foreground truncate text-caption">
            {session.roleUser.name}
          </p>
        </div>
        <LogoutButton className={cn(IDLE, FOCUS)} />
      </div>
    </aside>
  );
}

function NavLink({
  href,
  label,
  icon: Icon,
  pathname,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  pathname: string;
}) {
  const isActive = isTabActive(href, pathname);

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        ITEM,
        "text-title",
        isActive ? ACTIVE : cn("text-sidebar-foreground font-medium", IDLE),
      )}
    >
      <Icon
        className={cn(
          "size-4 shrink-0",
          !isActive && "text-sidebar-muted-foreground",
        )}
        aria-hidden
      />
      <span className="truncate">{label}</span>
    </Link>
  );
}

/**
 * Isinya `session.menu` apa adanya (sudah difilter per peran). Tiap domain
 * `<details name="sidebar-domain">`: accordion eksklusif bawaan browser —
 * membuka satu menutup yang lain, tanpa state React. Domain yang memuat rute
 * aktif (halaman domain atau salah satu layarnya) dirender `open`.
 */
export function SidebarNav({
  menu,
  pathname,
}: {
  menu: MenuNode[];
  pathname: string;
}) {
  return (
    <nav
      aria-label="Navigasi utama"
      className="flex-1 overflow-y-auto overscroll-contain px-3 py-3"
    >
      <ul className="space-y-1">
        <li>
          <NavLink href="/" label="Beranda" icon={House} pathname={pathname} />
        </li>
        <li>
          <NavLink
            href="/modul"
            label="Cari modul atau layar"
            icon={Search}
            pathname={pathname}
          />
        </li>
      </ul>

      <ul className="border-sidebar-border mt-3 space-y-1 border-t pt-3">
        {menu.map((domain) => {
          const Icon = MENU_ICON[domain.slug];

          return (
            <li key={domain.slug}>
              <details
                name="sidebar-domain"
                open={isTabActive(domainHref(domain.slug), pathname)}
                className="group"
              >
                <summary
                  className={cn(
                    ITEM,
                    IDLE,
                    "text-sidebar-foreground cursor-pointer list-none text-title font-medium [&::-webkit-details-marker]:hidden",
                  )}
                >
                  {Icon ? (
                    <Icon
                      className="text-sidebar-muted-foreground size-4 shrink-0"
                      aria-hidden
                    />
                  ) : null}
                  <span className="flex-1 truncate">{domain.name}</span>
                  <ChevronDown
                    className="text-sidebar-muted-foreground size-4 shrink-0 transition-transform group-open:rotate-180"
                    aria-hidden
                  />
                </summary>

                <ul className="mt-1 mb-2 space-y-1">
                  {domain.children.map((leaf) => {
                    const href = menuHref(domain.slug, leaf.slug);
                    const isActive = isTabActive(href, pathname);

                    return (
                      <li key={leaf.slug}>
                        <Link
                          href={href}
                          aria-current={isActive ? "page" : undefined}
                          className={cn(
                            ITEM,
                            "pl-10 text-body",
                            isActive
                              ? ACTIVE
                              : cn("text-sidebar-muted-foreground", IDLE),
                          )}
                        >
                          <span className="truncate">{leaf.name}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </details>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
