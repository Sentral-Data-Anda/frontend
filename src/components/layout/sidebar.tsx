"use client";

import { Menu } from "@base-ui/react/menu";
import { Tooltip } from "@base-ui/react/tooltip";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  House,
  LayoutGrid,
  LogOut,
  Search,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";

import { Avatar } from "@/components/common/avatar";
import {
  MENU_ICON,
  domainEntryHref,
  domainHref,
  menuHref,
} from "@/config/menu";
import { useSession } from "@/features/auth/session-provider";
import type { MenuNode } from "@/features/auth/types";
import { cn } from "@/lib/utils";

import { AppIdentity } from "./app-identity";
import { isTabActive } from "./bottom-tab";
import { LogoutButton, logout } from "./logout-button";
import { SIDEBAR_MOTION, sidebarCookie } from "./sidebar-collapse";

// Offset 2px: ring selalu berbatasan dengan navy (5.20:1), termasuk di
// sekeliling chip aktif yang terang.
const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar-ring";

// px-2.5 di dalam nav px-4: pusat ikon 20px = 16 + 10 + 10 = 36px dari tepi
// aside — tepat pusat rail 72px. Ikon tidak pernah bergeser; yang berubah
// hanya lebar item (di rail 40px = chip persegi) dan label di sebelahnya.
// `overflow-hidden` memotong label/chevron yang tersisa saat item menyempit
// (outline fokus di luar kotak, tidak ikut terpotong).
const ITEM = cn(
  "flex h-10 items-center gap-3 overflow-hidden rounded-control px-2.5 transition-colors",
  FOCUS,
);

// Hover memutihkan teks: p200 di atas accent p800 hanya 3.82:1.
const IDLE = "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";

const ACTIVE = "bg-sidebar-primary text-sidebar-primary-foreground font-medium";

// Isi yang hanya milik mode penuh memudar selama aside menyempit/melebar.
const FADE = cn(
  "transition-opacity group-data-collapsed/sidebar:opacity-0",
  SIDEBAR_MOTION,
);

// Satu baris, terpotong rapi — tidak pernah wrap, tanpa elipsis yang
// bergeser tiap frame saat menyempit.
const LABEL = cn(
  "min-w-0 flex-1 truncate group-data-collapsed/sidebar:text-clip",
  FADE,
);

/**
 * - `full`: isi mode penuh, lebar 16rem.
 * - `narrow`: isi mode penuh dengan gaya ringkas — hanya hidup selama
 *   transisi. Label memudar, Cari dan sub-layar mengempis ke 0, domain aktif
 *   memakai chip rail; geometrinya identik dengan `rail`.
 * - `rail`: isi rail (tautan domain, tooltip, menu akun), lebar 72px.
 */
export type SidebarMode = "full" | "narrow" | "rail";

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
 * Gerak ciut/lebar = satu gerakan (keluhan user 2026-09-22: "masih ga
 * smooth"). Rail dan mode penuh berbagi geometri: ikon, logo dan avatar di
 * kolom x yang sama, jadi hanya lebar aside + label yang bergerak. Perilaku
 * yang berbeda (accordion vs tautan domain, menu akun) ditukar saat tidak
 * terlihat: menyempit = gaya ringkas dulu (`narrow`), isi rail setelah
 * transisi selesai; melebar = isi penuh dengan gaya ringkas di-commit dulu,
 * lalu gayanya dilepas supaya label, Cari dan sub-layar ikut bertransisi.
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
  const [mode, setMode] = useState<SidebarMode>(
    defaultCollapsed ? "rail" : "full",
  );
  const isCollapsed = mode !== "full";
  const name = session.jemaat?.name ?? session.username;
  const role = session.roleUser.name;
  const ref = useRef<HTMLElement>(null);
  const toggleLabel = isCollapsed ? "Lebarkan menu" : "Ciutkan menu";
  const ToggleIcon = isCollapsed ? ChevronRight : ChevronLeft;

  // Di 1024×768 layar ke-11 Keuangan ada di bawah lipatan navigasi.
  useEffect(() => {
    ref.current
      ?.querySelector("nav [aria-current]")
      ?.scrollIntoView({ block: "nearest" });
  }, [pathname]);

  const onToggle = () => {
    document.cookie = sidebarCookie(!isCollapsed);

    if (isCollapsed) {
      if (mode === "rail") {
        flushSync(() => setMode("narrow"));
        // Paksa gaya ringkas isi baru terhitung dulu; tanpa ini browser
        // langsung melihat keadaan akhir dan tidak ada yang bertransisi.
        ref.current?.getBoundingClientRect();
      }
      setMode("full");
      return;
    }

    flushSync(() => setMode("narrow"));
    // Tanpa animasi (motion-reduce) daftarnya kosong → rail seketika.
    // Transisi yang dibatalkan (klik lagi di tengah jalan) menolak `finished`.
    Promise.all(
      (ref.current?.getAnimations() ?? []).map((a) => a.finished),
    ).then(
      () => setMode((m) => (m === "narrow" ? "rail" : m)),
      () => {},
    );
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
              // Duduk di persimpangan garis bawah baris identitas (py-4 + 36px
              // = 68px) dan garis tepi sidebar — jauh dari logo, tidak
              // berdesakan dengannya. Bidang 24px (pengecualian aturan 36px);
              // `after:` memperluas area sentuh ke ±40px.
              "absolute top-17 right-0 z-10 flex size-6 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full after:absolute after:-inset-2",
              // Bidang putih: 8.44:1 terhadap navy. Garis `--input` (p500):
              // ≥3:1 terhadap kanvas, jadi batasnya terbaca di kedua sisi.
              "bg-card text-foreground border-input hover:border-primary border shadow-sm transition-colors",
              // Fokus dua warna: cincin p200 (terbaca di navy) + outline navy
              // (terbaca di kanvas).
              "focus-visible:outline-sidebar focus-visible:ring-sidebar-ring focus-visible:ring-2 focus-visible:outline-2 focus-visible:outline-offset-2",
            )}
          >
            <ToggleIcon className="size-3.5" strokeWidth={2.5} aria-hidden />
          </button>
        </RailTip>

        <aside
          ref={ref}
          data-collapsed={isCollapsed || undefined}
          className={cn(
            "group/sidebar bg-sidebar text-sidebar-foreground flex shrink-0 flex-col overflow-hidden transition-[width]",
            SIDEBAR_MOTION,
            isCollapsed ? "w-18" : "w-64",
          )}
        >
          {/* px-4.5: pusat logo & avatar 36px = 18 + 18 = pusat rail. */}
          <div className="border-sidebar-border flex border-b px-4.5 py-4">
            <AppIdentity role={role} tone="sidebar" isCompact={isCollapsed} />
          </div>

          <SidebarNav menu={session.menu} pathname={pathname} mode={mode} />

          <div className="border-sidebar-border flex items-center gap-3 border-t px-4.5 py-3">
            {mode === "rail" ? (
              <AccountMenu name={name} role={role} />
            ) : (
              <>
                <Avatar label={name} />
                <div className={cn("min-w-0 flex-1", FADE)}>
                  <p className="truncate text-body font-medium">{name}</p>
                  <p className="text-sidebar-muted-foreground truncate text-caption">
                    {role}
                  </p>
                </div>
                <LogoutButton className={cn(IDLE, FOCUS, FADE)} />
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
 * bertahan sampai pointer/fokus pergi. Nama aksesibel tetap nama pemicunya
 * — tooltip hanya untuk mata. `isDisabled` (mode penuh dan selama transisi)
 * mempertahankan elemen pemicunya, jadi tautan tidak di-mount ulang.
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

/**
 * Satu bentuk untuk kedua mode. Di rail labelnya tetap di DOM (memudar,
 * lebar 0) sebagai nama aksesibel — dibaca sekali, tanpa `aria-label`
 * ganda; tooltip menampilkannya untuk mata.
 */
function NavLink({
  href,
  label,
  icon: Icon,
  current,
  hasTip = false,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  current?: "page" | "true";
  hasTip?: boolean;
}) {
  const isActive = current !== undefined;

  return (
    <RailTip label={label} isDisabled={!hasTip}>
      <Link
        href={href}
        aria-current={current}
        className={cn(
          ITEM,
          "text-title",
          isActive ? ACTIVE : cn("text-sidebar-foreground font-medium", IDLE),
        )}
      >
        <Icon
          className={cn(
            "size-5 shrink-0",
            !isActive && "text-sidebar-muted-foreground",
          )}
          aria-hidden
        />
        <span className={LABEL}>{label}</span>
      </Link>
    </RailTip>
  );
}

/**
 * Isi yang hanya ada di mode penuh (Cari, sub-layar domain) mengempis ke
 * tinggi 0 lewat `grid-template-rows` 1fr → 0fr, jadi baris di bawahnya
 * naik perlahan, bukan melompat saat isi rail menggantikannya.
 *
 * `-m-1 p-1` pada pemotong: ruang 4px untuk outline fokus anak yang
 * `overflow-hidden` akan memotong; margin negatif membuat sumbangan tingginya
 * tetap 0 saat terlipat.
 */
function Fold({
  isFolded,
  children,
}: {
  isFolded: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      inert={isFolded}
      className={cn(
        "grid grid-rows-[1fr] transition-[grid-template-rows,opacity] group-data-collapsed/sidebar:grid-rows-[0fr] group-data-collapsed/sidebar:opacity-0",
        SIDEBAR_MOTION,
      )}
    >
      <div className="-m-1 min-h-0 overflow-hidden p-1">{children}</div>
    </div>
  );
}

const currentOf = (href: string, pathname: string) =>
  isTabActive(href, pathname) ? "page" : undefined;

/**
 * Isinya `session.menu` apa adanya (sudah difilter per peran).
 *
 * Mode penuh: tiap domain `<details name="sidebar-domain">` — accordion
 * eksklusif bawaan browser, membuka satu menutup yang lain, tanpa state
 * React. Domain yang memuat rute aktif (halaman domain atau salah satu
 * layarnya) dirender `open`.
 *
 * Rail: tanpa accordion dan tanpa flyout. Domain = tautan ke
 * `domainEntryHref` — tujuan yang sama dengan tile Beranda; domain yang
 * memuat layar aktif diberi chip aktif. Tanpa Cari (keputusan 2026-09-22):
 * rail hanya untuk berpindah.
 */
export function SidebarNav({
  menu,
  pathname,
  mode = "full",
}: {
  menu: MenuNode[];
  pathname: string;
  mode?: SidebarMode;
}) {
  const isRail = mode === "rail";
  const isFolded = mode !== "full";

  return (
    <nav
      aria-label="Navigasi utama"
      className="flex-1 overflow-y-auto overscroll-contain px-4 py-3"
    >
      <ul>
        <li>
          <NavLink
            href="/"
            label="Beranda"
            icon={House}
            current={currentOf("/", pathname)}
            hasTip={isRail}
          />
        </li>
        {isRail ? null : (
          <li>
            <Fold isFolded={isFolded}>
              <div className="pt-0.5">
                <NavLink
                  href="/modul"
                  label="Cari modul atau layar"
                  icon={Search}
                  current={currentOf("/modul", pathname)}
                />
              </div>
            </Fold>
          </li>
        )}
      </ul>

      <ul className="border-sidebar-border mt-3 space-y-0.5 border-t pt-3">
        {menu.map((domain) => {
          const Icon = MENU_ICON[domain.slug] ?? LayoutGrid;
          const isActive = isTabActive(domainHref(domain.slug), pathname);

          if (isRail) {
            const href = domainEntryHref(domain);

            // "true", bukan "page", bila yang dibuka layar di dalamnya:
            // halaman yang dibuka adalah layarnya, bukan domainnya.
            return (
              <li key={domain.slug}>
                <NavLink
                  href={href}
                  label={domain.name}
                  icon={Icon}
                  current={
                    href === pathname ? "page" : isActive ? "true" : undefined
                  }
                  hasTip
                />
              </li>
            );
          }

          return (
            <li key={domain.slug}>
              <details name="sidebar-domain" open={isActive} className="group">
                <summary
                  className={cn(
                    ITEM,
                    IDLE,
                    "text-sidebar-foreground cursor-pointer list-none text-title font-medium [&::-webkit-details-marker]:hidden",
                    // Selama transisi ke rail, chip aktif rail memudar masuk
                    // di sini, bukan muncul tiba-tiba saat isinya ditukar.
                    isActive &&
                      "group-data-collapsed/sidebar:bg-sidebar-primary group-data-collapsed/sidebar:text-sidebar-primary-foreground",
                  )}
                >
                  <Icon
                    className={cn(
                      "text-sidebar-muted-foreground size-5 shrink-0",
                      isActive && "group-data-collapsed/sidebar:text-current",
                    )}
                    aria-hidden
                  />
                  <span className={LABEL}>{domain.name}</span>
                  <ChevronDown
                    className={cn(
                      "text-sidebar-muted-foreground size-4 shrink-0 transition-[rotate,opacity] group-open:rotate-180 group-data-collapsed/sidebar:opacity-0",
                      SIDEBAR_MOTION,
                    )}
                    aria-hidden
                  />
                </summary>

                <Fold isFolded={isFolded}>
                  <ul className="mt-1 mb-2 space-y-1">
                    {domain.children.map((leaf) => {
                      const href = menuHref(domain.slug, leaf.slug);
                      const isLeafActive = isTabActive(href, pathname);

                      return (
                        <li key={leaf.slug}>
                          <Link
                            href={href}
                            aria-current={isLeafActive ? "page" : undefined}
                            className={cn(
                              ITEM,
                              // Rata dengan label domain: 10 + 20 + 12.
                              "pl-10.5 text-title",
                              isLeafActive
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
                </Fold>
              </details>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
