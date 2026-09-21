"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Logo } from "@/components/common/logo";
import { MENU_ICON, menuHref } from "@/config/menu";
import { useSession } from "@/features/auth/session-provider";
import type { MenuNode } from "@/features/auth/types";
import { cn } from "@/lib/utils";

import { isTabActive } from "./bottom-tab";

/**
 * Navigasi desktop (≥ lg). Isinya pohon `session.menu` apa adanya — domain →
 * layar — bukan `TABS` milik bottom tab: di PC pengurus butuh seluruh layar
 * CRUD, bukan empat pintasan jemaat.
 *
 * Tiap domain memakai `<details>` native: buka/tutup tanpa state React, dan
 * domain yang memuat layar aktif dirender `open` supaya posisi user terlihat
 * begitu halaman dimuat.
 */
export function Sidebar() {
  const session = useSession();
  const pathname = usePathname();

  return (
    // `h-dvh` + `overflow-y-auto` di sini, bukan di `<main>`: 12 domain terbuka
    // bisa lebih tinggi dari 768px (iPad landscape), dan sidebar harus scroll
    // sendiri tanpa memindahkan scroll konten keluar dari dokumen.
    <aside className="border-border bg-card sticky top-0 hidden h-dvh w-64 shrink-0 flex-col overflow-y-auto overscroll-contain border-r lg:flex">
      <div className="px-4 py-5">
        <Logo />
      </div>
      <SidebarNav menu={session.menu} pathname={pathname} />
    </aside>
  );
}

export function SidebarNav({
  menu,
  pathname,
}: {
  menu: MenuNode[];
  pathname: string;
}) {
  return (
    <nav aria-label="Navigasi utama" className="flex-1 px-2 pb-6">
      <ul className="space-y-1">
        {menu.map((domain) => {
          const Icon = MENU_ICON[domain.slug];
          const isDomainActive = domain.children.some((leaf) =>
            isTabActive(menuHref(domain.slug, leaf.slug), pathname),
          );

          return (
            <li key={domain.slug}>
              <details open={isDomainActive} className="group">
                <summary className="hover:bg-muted flex h-10 cursor-pointer list-none items-center gap-3 rounded-lg px-3 text-body font-medium [&::-webkit-details-marker]:hidden">
                  {Icon ? (
                    <Icon
                      className="text-muted-foreground size-4 shrink-0"
                      aria-hidden
                    />
                  ) : null}
                  <span className="flex-1 truncate">{domain.name}</span>
                  <ChevronDown
                    className="text-muted-foreground size-4 shrink-0 transition-transform group-open:rotate-180"
                    aria-hidden
                  />
                </summary>

                <ul className="mt-1 mb-2 space-y-0.5">
                  {domain.children.map((leaf) => {
                    const href = menuHref(domain.slug, leaf.slug);
                    const isActive = isTabActive(href, pathname);

                    return (
                      <li key={leaf.slug}>
                        <Link
                          href={href}
                          aria-current={isActive ? "page" : undefined}
                          className={cn(
                            "flex h-9 items-center rounded-lg pr-3 pl-10 text-body",
                            isActive
                              ? "bg-muted text-foreground font-medium"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground",
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
