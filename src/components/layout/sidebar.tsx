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
import {
  createContext,
  memo,
  use,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { flushSync } from "react-dom";

import { Avatar } from "@/components/common/avatar";
import { MENU_ICON, domainHref, menuHref } from "@/config/menu";
import { useSession } from "@/features/auth/session-provider";
import type { MenuNode } from "@/features/auth/types";
import { useBoolean } from "@/hooks/use-boolean";
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

// Semua gaya ringkas digerakkan satu atribut, `data-collapsed` pada aside.
// `invisible` mengeluarkan isi mode penuh dari urutan Tab dan pohon a11y
// tanpa state React. `visibility` hanya ada di daftar transisi keadaan
// RINGKAS (`group-data-collapsed/sidebar:transition-[…visibility]`; daftar
// dasar tanpa `visibility`, `transition-none` bila perlu — `duration-*`
// tanpa daftar berarti `all`). Transisi memakai daftar keadaan tujuan: saat
// menyempit isi tetap terlihat sampai akhir, saat melebar langsung terlihat.
// Kalau ikut ditransisikan saat melebar, di awal gerak nilainya masih
// `hidden` dan `focus()` ke summary (klik domain di rail) gagal.
const RAIL_HIDDEN = cn(
  // Varian ringkas lebih spesifik daripada `motion-reduce:transition-none`
  // di SIDEBAR_MOTION, jadi dimatikan lagi di tingkat yang sama.
  "group-data-collapsed/sidebar:invisible motion-reduce:group-data-collapsed/sidebar:transition-none",
  SIDEBAR_MOTION,
);

// Isi yang hanya milik mode penuh: memudar lalu tak terlihat.
const HIDE_IN_RAIL = cn(
  "transition-opacity group-data-collapsed/sidebar:transition-[opacity,visibility] group-data-collapsed/sidebar:opacity-0",
  RAIL_HIDDEN,
);

// Satu baris, terpotong rapi — tidak pernah wrap, tanpa elipsis yang
// bergeser tiap frame saat menyempit. Hanya opacity (bukan `invisible`):
// di rail label Beranda tetap nama aksesibel tautannya.
const LABEL = cn(
  "min-w-0 flex-1 truncate transition-opacity group-data-collapsed/sidebar:text-clip group-data-collapsed/sidebar:opacity-0",
  SIDEBAR_MOTION,
);

// Tooltip nav hanya berarti di rail. Konteks, bukan prop: `SidebarNav`
// di-memo dan tidak ikut dirender ulang saat toggle — hanya `RailTip`.
const CollapsedContext = createContext(false);

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
 * Ciut/lebar = satu gerakan CSS (keluhan user 2026-09-22: "masih ga
 * smooth"). Satu DOM untuk kedua mode — isi rail dan isi penuh selalu
 * ter-mount, ditukar lewat varian `group-data-collapsed/sidebar:*`; klik
 * hanya membalik satu atribut, tanpa me-mount apa pun. Ikon, logo dan avatar
 * di kolom x yang sama, jadi hanya lebar aside + label yang bergerak. Klik
 * beruntun aman: transisi CSS berbalik arah sendiri.
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
  const ToggleIcon = isCollapsed.value ? ChevronRight : ChevronLeft;

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

  // Stabil (setter useBoolean stabil): `SidebarNav` di-memo.
  const { onFalse: expand } = isCollapsed;
  const onExpand = useCallback(() => {
    document.cookie = sidebarCookie(false);
    expand();
  }, [expand]);

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

        <CollapsedContext value={isCollapsed.value}>
          <aside
            ref={ref}
            data-collapsed={isCollapsed.value || undefined}
            className={cn(
              "group/sidebar bg-sidebar text-sidebar-foreground flex shrink-0 flex-col overflow-hidden transition-[width]",
              SIDEBAR_MOTION,
              isCollapsed.value ? "w-18" : "w-64",
            )}
          >
            {/* px-4.5: pusat logo & avatar 36px = 18 + 18 = pusat rail. */}
            <div className="border-sidebar-border flex border-b px-4.5 py-4">
              <AppIdentity
                role={role}
                tone="sidebar"
                isCompact={isCollapsed.value}
              />
            </div>

            <SidebarNav
              menu={session.menu}
              pathname={pathname}
              onExpand={onExpand}
            />

            {/* Dua avatar di titik yang sama: pemicu menu akun (rail) dan
                avatar biasa (penuh) — tukar `display` tanpa beda piksel. */}
            <div className="border-sidebar-border flex items-center gap-3 border-t px-4.5 py-3">
              <AccountMenu name={name} role={role} />
              <div className="group-data-collapsed/sidebar:hidden">
                <Avatar label={name} />
              </div>
              <div className={cn("min-w-0 flex-1", HIDE_IN_RAIL)}>
                <p className="truncate text-body font-medium">{name}</p>
                <p className="text-sidebar-muted-foreground truncate text-caption">
                  {role}
                </p>
              </div>
              <LogoutButton className={cn(IDLE, FOCUS, HIDE_IN_RAIL)} />
            </div>
          </aside>
        </CollapsedContext>
      </div>
    </Tooltip.Provider>
  );
}

/**
 * Rail tidak punya ruang untuk nama + tombol Keluar, jadi avatar menjadi
 * pemicu menu. Primitif Base UI mengurus `aria-haspopup`, panah, Escape
 * (menutup + fokus kembali ke avatar) dan portal (lolos dari
 * `overflow-hidden` aside). Hanya tampil di rail — mode penuh tetap 1 klik.
 */
const AccountMenu = memo(function AccountMenu({
  name,
  role,
}: {
  name: string;
  role: string;
}) {
  return (
    <Menu.Root>
      <RailTip label={name}>
        <Menu.Trigger
          aria-label={`Akun: ${name}`}
          className={cn(
            "hidden rounded-full group-data-collapsed/sidebar:block",
            FOCUS,
          )}
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
});

/**
 * Label terlihat untuk kontrol ikon saja, muncul saat hover DAN fokus
 * keyboard. Primitif Base UI (sudah terpasang) memenuhi WCAG 1.4.13: hilang
 * dengan Escape tanpa memindah fokus, bisa di-hover tanpa menutup, dan
 * bertahan sampai pointer/fokus pergi. Nama aksesibel tetap nama pemicunya
 * — tooltip hanya untuk mata. `isRailOnly`: mati di mode penuh, tempat
 * labelnya sudah terlihat.
 */
function RailTip({
  label,
  isRailOnly = false,
  children,
}: {
  label: string;
  isRailOnly?: boolean;
  children: React.ReactElement;
}) {
  // `use` bersyarat (sah untuk `use`): hanya pemicu yang terlihat di kedua
  // mode (Beranda, Cari) yang berlangganan dan ikut dirender ulang saat
  // toggle. Tautan rail domain dan avatar menu akun tidak perlu: di mode
  // penuh keduanya tak terlihat, jadi tooltipnya tidak mungkin terbuka.
  const isDisabled = isRailOnly && !use(CollapsedContext);

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
 * Isi yang hanya ada di mode penuh (Cari, sub-layar domain) selalu
 * ter-mount dan mengempis ke tinggi 0 lewat `grid-template-rows` 1fr → 0fr,
 * jadi baris di bawahnya bergerak perlahan.
 *
 * `grid-cols-1` (= `minmax(0, 1fr)`): kolom implisit `auto` selebar
 * max-content teksnya dan membuat nav rail bisa digulir ke samping.
 *
 * `-m-1 p-1` pada pemotong: ruang 4px untuk outline fokus anak; margin
 * negatif membuat sumbangan tingginya tetap 0 saat terlipat. `overflow-clip`,
 * bukan `hidden`: bukan wadah scroll, jadi `scrollIntoView` layar aktif di
 * rail tidak bisa menggulir isinya diam-diam.
 */
function Fold({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 grid-rows-[1fr] transition-[grid-template-rows,opacity] group-data-collapsed/sidebar:grid-rows-[0fr] group-data-collapsed/sidebar:opacity-0 group-data-collapsed/sidebar:transition-[grid-template-rows,opacity,visibility]",
        RAIL_HIDDEN,
      )}
    >
      <div className="-m-1 min-h-0 overflow-clip p-1">{children}</div>
    </div>
  );
}

/**
 * Satu tautan untuk kedua mode. Di rail labelnya tetap di DOM (memudar,
 * lebar 0) sebagai nama aksesibel — dibaca sekali, tanpa `aria-label`
 * ganda; tooltip menampilkannya untuk mata.
 */
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
    <RailTip label={label} isRailOnly>
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
 * Klik domain di rail (permintaan user 2026-09-22): lebarkan sidebar dan buka
 * accordion domain itu — di desktop sub-layar dibuka di sidebar, bukan lewat
 * halaman domain (`/<domain>` tetap untuk HP/tablet dan URL langsung).
 *
 * Urutan penting untuk satu gerakan:
 * 1. `open = true` saat gaya ringkas masih berlaku — `<details name>`
 *    menutup domain lain; lipatan sub-layarnya dihitung di 0fr (paksa
 *    layout), jadi ia tumbuh ke tinggi penuh bersama lebar aside.
 * 2. `flushSync`: atribut `data-collapsed` lepas sekarang, summary sudah
 *    terlihat saat difokus.
 * 3. Selama lipatan tumbuh, tiap frame domain digulir ke pandangan
 *    (`nearest`): gulirnya ikut gerakan yang sama, bukan lompatan sesudahnya.
 *    Tanpa animasi (motion-reduce) cukup sekali; diciutkan lagi di tengah
 *    jalan (`finished` ditolak) → berhenti.
 */
function openFromRail(details: HTMLDetailsElement, onExpand: () => void) {
  details.open = true;
  details.getBoundingClientRect();
  flushSync(onExpand);
  details.querySelector("summary")?.focus({ preventScroll: true });

  const fold = details.lastElementChild as HTMLElement;
  let isDone = false;
  const follow = () => {
    details.scrollIntoView({ block: "nearest" });
    if (!isDone) requestAnimationFrame(follow);
  };

  Promise.all(fold.getAnimations().map((a) => a.finished))
    .catch(() => {})
    .finally(() => (isDone = true));
  requestAnimationFrame(follow);
}

/**
 * Isinya `session.menu` apa adanya (sudah difilter per peran). Satu DOM
 * untuk kedua mode; `data-collapsed` pada aside yang memilih apa yang
 * tampil.
 *
 * Mode penuh: tiap domain `<details name="sidebar-domain">` — accordion
 * eksklusif bawaan browser, membuka satu menutup yang lain, tanpa state
 * React. Domain yang memuat rute aktif (halaman domain atau salah satu
 * layarnya) dirender `open`.
 *
 * Rail: `<details>` tak terlihat (tetap memegang baris 40px-nya), di atasnya
 * tombol ikon domain yang melebarkan sidebar dan membuka accordion domain
 * itu (`openFromRail`), tanpa flyout; domain yang memuat layar aktif diberi
 * chip aktif. Keduanya bertukar lewat `visibility` + `opacity` (crossfade),
 * bukan `display`, supaya chip rail memudar masuk alih-alih muncul
 * tiba-tiba. Tanpa Pencarian (keputusan 2026-09-22): rail hanya untuk
 * berpindah.
 */
export const SidebarNav = memo(function SidebarNav({
  menu,
  pathname,
  onExpand = () => {},
}: {
  menu: MenuNode[];
  pathname: string;
  /** Lebarkan sidebar + tulis cookie — dipanggil tombol domain di rail. */
  onExpand?: () => void;
}) {
  return (
    <nav
      aria-label="Navigasi utama"
      className="flex-1 overflow-y-auto overscroll-contain px-4 py-3"
    >
      <ul>
        <li>
          <NavLink href="/" label="Beranda" icon={House} pathname={pathname} />
        </li>
        {/* `li` ikut tak terlihat: tanpa ini rail punya listitem kosong. */}
        <li
          className={cn(
            "transition-none group-data-collapsed/sidebar:transition-[visibility]",
            RAIL_HIDDEN,
          )}
        >
          <Fold>
            <div className="pt-0.5">
              <NavLink
                href="/modul"
                label="Cari modul atau layar"
                icon={Search}
                pathname={pathname}
              />
            </div>
          </Fold>
        </li>
      </ul>

      {/* Garis pemisah hanya milik mode penuh (rail tanpa garis — keluhan
          user). Ringkas: mt-px + garis 1px transparan → jarak Beranda ke
          domain pertama = 42px, sama dengan jarak antar-ikon. */}
      <ul
        className={cn(
          "border-sidebar-border mt-3 space-y-0.5 border-t pt-3 transition-[margin,padding,border-color]",
          "group-data-collapsed/sidebar:mt-px group-data-collapsed/sidebar:border-transparent group-data-collapsed/sidebar:pt-0",
          SIDEBAR_MOTION,
        )}
      >
        {menu.map((domain) => {
          const Icon = MENU_ICON[domain.slug] ?? LayoutGrid;
          const isActive = isTabActive(domainHref(domain.slug), pathname);

          return (
            <li key={domain.slug} className="relative">
              <details
                name="sidebar-domain"
                open={isActive}
                className={cn(
                  "group transition-none group-data-collapsed/sidebar:transition-[visibility]",
                  RAIL_HIDDEN,
                )}
              >
                <summary
                  className={cn(
                    ITEM,
                    IDLE,
                    "text-sidebar-foreground cursor-pointer list-none text-title font-medium [&::-webkit-details-marker]:hidden",
                  )}
                >
                  <Icon
                    className="text-sidebar-muted-foreground size-5 shrink-0"
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

                <Fold>
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

              {/* Setelah `<details>`: `scrollIntoView` [aria-current]
                  pertama tetap menemukan layar aktif di mode penuh. */}
              <RailTip label={domain.name}>
                <button
                  type="button"
                  onClick={(event) =>
                    openFromRail(
                      event.currentTarget.parentElement?.querySelector(
                        "details",
                      ) as HTMLDetailsElement,
                      onExpand,
                    )
                  }
                  // "true": domain ini memuat halaman yang sedang dibuka.
                  aria-current={isActive ? "true" : undefined}
                  className={cn(
                    ITEM,
                    "invisible absolute inset-x-0 top-0 w-full cursor-pointer opacity-0 transition-[opacity,visibility,color,background-color]",
                    "pointer-events-none group-data-collapsed/sidebar:pointer-events-auto group-data-collapsed/sidebar:visible group-data-collapsed/sidebar:opacity-100",
                    SIDEBAR_MOTION,
                    isActive
                      ? ACTIVE
                      : cn("text-sidebar-muted-foreground bg-sidebar", IDLE),
                  )}
                >
                  <Icon className="size-5 shrink-0" aria-hidden />
                  <span className="sr-only">{domain.name}</span>
                </button>
              </RailTip>
            </li>
          );
        })}
      </ul>
    </nav>
  );
});
