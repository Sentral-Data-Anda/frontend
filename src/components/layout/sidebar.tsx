"use client";

import { Tooltip } from "@base-ui/react/tooltip";
import {
  ChevronDown,
  House,
  LayoutGrid,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { Avatar } from "@/components/common/avatar";
import { Button } from "@/components/common/button";
import {
  MENU_ICON,
  domainEntryHref,
  domainHref,
  menuHref,
} from "@/config/menu";
import { useSession } from "@/features/auth/session-provider";
import type { MenuNode } from "@/features/auth/types";
import { useBoolean } from "@/hooks/use-boolean";
import { cn } from "@/lib/utils";

import { AppIdentity } from "./app-identity";
import { isTabActive } from "./bottom-tab";
import { LogoutButton } from "./logout-button";
import { sidebarCookie } from "./sidebar-collapse";

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

const ICON_BUTTON = cn(
  "text-sidebar-muted-foreground focus-visible:border-transparent focus-visible:ring-0",
  IDLE,
  FOCUS,
);

/**
 * Seluruh chrome global desktop (≥ lg) — tidak ada top bar. Identitas di
 * atas dan pengguna + Keluar di bawah diam; hanya navigasi di tengah yang
 * scroll, supaya 1024×768 dengan domain Keuangan (11 layar) terbuka tidak
 * memotong apa pun.
 *
 * Bisa diringkas jadi rail ikon 72px (permintaan user 2026-09-22). Nilai
 * awalnya dari cookie yang dibaca `AppShell` di server; toggle menulis cookie
 * yang sama tanpa reload. Anak tiap bagian dijaga di posisi pohon yang sama
 * di kedua mode, supaya tombol toggle tidak dipasang ulang dan fokus tetap
 * di sana.
 */
export function Sidebar({ defaultCollapsed }: { defaultCollapsed: boolean }) {
  const session = useSession();
  const pathname = usePathname();
  const isCollapsed = useBoolean(defaultCollapsed);
  const name = session.jemaat?.name ?? session.username;
  const ref = useRef<HTMLElement>(null);
  const toggleLabel = isCollapsed.value ? "Lebarkan menu" : "Ciutkan menu";

  // Di 1024×768 layar ke-11 Keuangan ada di bawah lipatan navigasi.
  useEffect(() => {
    ref.current
      ?.querySelector("nav [aria-current]")
      ?.scrollIntoView({ block: "nearest" });
  }, [pathname]);

  const onToggle = () => {
    const next = !isCollapsed.value;

    document.cookie = sidebarCookie(next);
    isCollapsed.setValue(next);
  };

  return (
    <Tooltip.Provider>
      <aside
        ref={ref}
        className={cn(
          "bg-sidebar text-sidebar-foreground sticky top-0 hidden h-dvh shrink-0 flex-col overflow-hidden transition-[width] duration-200 ease-out motion-reduce:transition-none lg:flex",
          isCollapsed.value ? "w-18" : "w-64",
        )}
      >
        <div
          className={cn(
            "border-sidebar-border flex border-b py-4",
            isCollapsed.value ? "justify-center" : "px-4",
          )}
        >
          <AppIdentity
            role={session.roleUser.name}
            tone="sidebar"
            isCompact={isCollapsed.value}
          />
        </div>

        <SidebarNav
          menu={session.menu}
          pathname={pathname}
          isCollapsed={isCollapsed.value}
        />

        {/*
          Tombol ciutkan di bawah navigasi, bukan di baris identitas: di sana
          ia memotong "SADA · SENTRAL DATA ANDA". Tempatnya sama di kedua mode
          — user menemukannya di tempat ia meninggalkannya, dan elemennya
          tidak dipasang ulang sehingga fokus bertahan.
        */}
        <div className="border-sidebar-border border-t px-3 py-2">
          <RailTip label={toggleLabel} isDisabled={!isCollapsed.value}>
            <Button
              variant="ghost"
              size={isCollapsed.value ? "icon" : "default"}
              aria-label={toggleLabel}
              onClick={onToggle}
              className={cn(
                ICON_BUTTON,
                isCollapsed.value
                  ? "mx-auto flex"
                  : "w-full justify-start gap-3",
              )}
            >
              {isCollapsed.value ? (
                <PanelLeftOpen className="size-4" aria-hidden />
              ) : (
                <PanelLeftClose className="size-4" aria-hidden />
              )}
              {isCollapsed.value ? null : (
                <span className="truncate">{toggleLabel}</span>
              )}
            </Button>
          </RailTip>
        </div>

        <div
          className={cn(
            "border-sidebar-border flex gap-3 border-t py-3",
            isCollapsed.value ? "flex-col items-center" : "items-center px-4",
          )}
        >
          {/* Di rail avatar tanpa nama tidak menyampaikan apa pun, dan
              memakan baris yang membuat ikon terakhir terpotong di 1024×768. */}
          {isCollapsed.value ? null : <Avatar label={name} />}
          {isCollapsed.value ? null : (
            <div className="min-w-0 flex-1">
              <p className="truncate text-body font-medium">{name}</p>
              <p className="text-sidebar-muted-foreground truncate text-caption">
                {session.roleUser.name}
              </p>
            </div>
          )}
          <RailTip label="Keluar" isDisabled={!isCollapsed.value}>
            <LogoutButton className={cn(IDLE, FOCUS)} />
          </RailTip>
        </div>
      </aside>
    </Tooltip.Provider>
  );
}

/**
 * Label terlihat untuk ikon rail, muncul saat hover DAN fokus keyboard.
 * Primitif Base UI (sudah terpasang) memenuhi WCAG 1.4.13: hilang dengan
 * Escape tanpa memindah fokus, bisa di-hover tanpa menutup, dan bertahan
 * sampai pointer/fokus pergi. Nama aksesibel tetap `aria-label` pemicunya —
 * tooltip hanya untuk mata.
 */
function RailTip({
  label,
  isDisabled = false,
  children,
}: {
  label: string;
  isDisabled?: boolean;
  children: React.ReactElement;
}) {
  return (
    <Tooltip.Root disabled={isDisabled}>
      <Tooltip.Trigger render={children} />
      <Tooltip.Portal>
        <Tooltip.Positioner side="right" sideOffset={10} className="z-50">
          <Tooltip.Popup className="bg-sidebar text-sidebar-foreground ring-sidebar-border rounded-control px-2 py-1 text-body font-medium shadow-md ring-1">
            {label}
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

function RailLink({
  href,
  label,
  icon: Icon,
  isActive,
  pathname,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  isActive: boolean;
  pathname: string;
}) {
  // Domain yang memuat layar aktif = "true" (lokasi di dalamnya), bukan
  // "page": halaman yang dibuka adalah layarnya, bukan domainnya.
  const current = href === pathname ? "page" : isActive ? "true" : undefined;

  return (
    <RailTip label={label}>
      <Link
        href={href}
        aria-label={label}
        aria-current={current}
        className={cn(
          "mx-auto flex size-control items-center justify-center rounded-control transition-colors",
          FOCUS,
          isActive ? ACTIVE : cn("text-sidebar-muted-foreground", IDLE),
        )}
      >
        <Icon className="size-4" aria-hidden />
      </Link>
    </RailTip>
  );
}

/**
 * Mode ringkas: ikon saja, tanpa accordion dan tanpa flyout. Ikon domain
 * membuka `domainEntryHref` — tujuan yang sama dengan tile Beranda.
 */
function RailNav({ menu, pathname }: { menu: MenuNode[]; pathname: string }) {
  return (
    <nav
      aria-label="Navigasi utama"
      className="flex-1 overflow-y-auto overscroll-contain py-3"
    >
      <ul className="space-y-1">
        <li>
          <RailLink
            href="/"
            label="Beranda"
            icon={House}
            isActive={isTabActive("/", pathname)}
            pathname={pathname}
          />
        </li>
        <li>
          <RailLink
            href="/modul"
            label="Cari modul atau layar"
            icon={Search}
            isActive={isTabActive("/modul", pathname)}
            pathname={pathname}
          />
        </li>
      </ul>

      <ul className="border-sidebar-border mx-3 mt-3 space-y-1 border-t pt-3">
        {menu.map((domain) => (
          <li key={domain.slug}>
            <RailLink
              href={domainEntryHref(domain)}
              label={domain.name}
              icon={MENU_ICON[domain.slug] ?? LayoutGrid}
              isActive={isTabActive(domainHref(domain.slug), pathname)}
              pathname={pathname}
            />
          </li>
        ))}
      </ul>
    </nav>
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
  isCollapsed = false,
}: {
  menu: MenuNode[];
  pathname: string;
  isCollapsed?: boolean;
}) {
  if (isCollapsed) return <RailNav menu={menu} pathname={pathname} />;

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
