"use client";

import { Menu } from "@base-ui/react/menu";
import { Tooltip } from "@base-ui/react/tooltip";
import {
  ChevronDown,
  House,
  LayoutGrid,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { Avatar } from "@/components/common/avatar";
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
import { LogoutButton, logout } from "./logout-button";
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

/**
 * Seluruh chrome global desktop (≥ lg) — tidak ada top bar. Identitas di
 * atas dan pengguna di bawah diam; hanya navigasi di tengah yang scroll,
 * supaya 1024×768 dengan domain Keuangan (11 layar) terbuka tidak memotong
 * apa pun.
 *
 * Bisa diringkas jadi rail ikon 72px (permintaan user 2026-09-22). Nilai
 * awalnya dari cookie yang dibaca `AppShell` di server; toggle menulis cookie
 * yang sama tanpa reload.
 *
 * Toggle duduk di garis tepi kanan, di LUAR `<aside>`: aside butuh
 * `overflow-hidden` selama transisi lebar dan akan memotong separuh tombol.
 * Pembungkus sticky yang memegang keduanya; `right-0` membuat tombol ikut
 * bergeser bersama lebar aside tanpa `fixed` + `left` hitungan. Satu elemen
 * di kedua mode (hanya label dan ikon yang berganti), jadi fokus bertahan.
 */
export function Sidebar({ defaultCollapsed }: { defaultCollapsed: boolean }) {
  const session = useSession();
  const pathname = usePathname();
  const isCollapsed = useBoolean(defaultCollapsed);
  const name = session.jemaat?.name ?? session.username;
  const role = session.roleUser.name;
  const ref = useRef<HTMLElement>(null);
  const toggleLabel = isCollapsed.value ? "Lebarkan menu" : "Ciutkan menu";
  const ToggleIcon = isCollapsed.value ? PanelLeftOpen : PanelLeftClose;

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
      <div className="sticky top-0 z-30 hidden h-dvh shrink-0 lg:flex">
        <RailTip label={toggleLabel}>
          <button
            type="button"
            aria-label={toggleLabel}
            onClick={onToggle}
            className={cn(
              // top-5: pusatnya = pusat logo (py-4 + 36px / 2 = 34px).
              // Bidang 28px — pengecualian aturan 36px; `after:` memperluas
              // area sentuh ke ±44px tanpa membesarkan bidangnya.
              "absolute top-5 right-0 z-10 flex size-7 translate-x-1/2 items-center justify-center rounded-full after:absolute after:-inset-2",
              // Navy + cincin p200: batas 5.20:1 di navy, bidang 7.70:1 di
              // kanvas. Bidang putih hanya 1.10:1 di kanvas.
              "bg-sidebar text-sidebar-foreground ring-sidebar-ring shadow-md ring-1 transition-colors",
              IDLE,
              // Fokus dua warna: cincin p200 menebal (terbaca di navy) +
              // outline navy (terbaca di kanvas).
              "focus-visible:outline-sidebar focus-visible:ring-2 focus-visible:outline-2 focus-visible:outline-offset-2",
            )}
          >
            <ToggleIcon className="size-3.5" aria-hidden />
          </button>
        </RailTip>

        <aside
          ref={ref}
          className={cn(
            "bg-sidebar text-sidebar-foreground flex shrink-0 flex-col overflow-hidden transition-[width] duration-200 ease-out motion-reduce:transition-none",
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
              role={role}
              tone="sidebar"
              isCompact={isCollapsed.value}
            />
          </div>

          <SidebarNav
            menu={session.menu}
            pathname={pathname}
            isCollapsed={isCollapsed.value}
          />

          <div
            className={cn(
              "border-sidebar-border flex items-center gap-3 border-t py-3",
              isCollapsed.value ? "justify-center" : "px-4",
            )}
          >
            {isCollapsed.value ? (
              <AccountMenu name={name} role={role} />
            ) : (
              <>
                <Avatar label={name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-body font-medium">{name}</p>
                  <p className="text-sidebar-muted-foreground truncate text-caption">
                    {role}
                  </p>
                </div>
                <LogoutButton className={cn(IDLE, FOCUS)} />
              </>
            )}
          </div>
        </aside>
      </div>
    </Tooltip.Provider>
  );
}

/**
 * Rail tidak punya ruang untuk nama + tombol Keluar, jadi avatar menjadi
 * pemicu menu. Primitif Base UI mengurus `aria-haspopup`, panah, Escape
 * (menutup + fokus kembali ke avatar) dan portal (lolos dari
 * `overflow-hidden` aside). Hanya ada di rail — mode penuh tetap 1 klik.
 */
function AccountMenu({ name, role }: { name: string; role: string }) {
  return (
    <Menu.Root>
      <RailTip label={name}>
        <Menu.Trigger
          aria-label={`Akun: ${name}`}
          className={cn("rounded-full", FOCUS)}
        >
          <Avatar label={name} />
        </Menu.Trigger>
      </RailTip>
      <Menu.Portal>
        <Menu.Positioner
          side="right"
          align="end"
          sideOffset={10}
          className="z-50"
        >
          <Menu.Popup className="bg-popover text-popover-foreground ring-border min-w-48 rounded-control p-1 shadow-md ring-1 outline-none">
            <Menu.Group>
              <Menu.GroupLabel className="px-2 py-1.5">
                <span className="block truncate text-lead font-semibold">
                  {name}
                </span>
                <span className="text-muted-foreground block truncate text-body">
                  {role}
                </span>
              </Menu.GroupLabel>
              <Menu.Separator className="bg-border -mx-1 my-1 h-px" />
              {/* Di dalam group, supaya label nama/role menamai item ini
                  (bukan group kosong). Sorotan navy + teks putih (8.44:1):
                  sorotan p50 di atas putih hanya 1.10:1. */}
              <Menu.Item
                onClick={() => void logout()}
                className="data-highlighted:bg-primary data-highlighted:text-primary-foreground flex h-control cursor-default items-center gap-2 rounded-control px-2 text-body font-medium outline-none select-none"
              >
                <LogOut className="size-4" aria-hidden />
                Keluar
              </Menu.Item>
            </Menu.Group>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

/**
 * Label terlihat untuk kontrol ikon saja, muncul saat hover DAN fokus
 * keyboard. Primitif Base UI (sudah terpasang) memenuhi WCAG 1.4.13: hilang
 * dengan Escape tanpa memindah fokus, bisa di-hover tanpa menutup, dan
 * bertahan sampai pointer/fokus pergi. Nama aksesibel tetap `aria-label`
 * pemicunya — tooltip hanya untuk mata.
 */
function RailTip({
  label,
  children,
}: {
  label: string;
  children: React.ReactElement;
}) {
  return (
    <Tooltip.Root>
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
 * membuka `domainEntryHref` — tujuan yang sama dengan tile Beranda. Tanpa
 * Cari (keputusan 2026-09-22): rail hanya untuk berpindah; Cari tetap ada
 * di mode penuh.
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
