"use client";

import { ChevronRight, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { BottomSheet } from "@/components/common/bottom-sheet";
import { PageHeader } from "@/components/layout/page-header";
import { MENU_ICON, menuHref } from "@/config/menu";
import { useSession } from "@/features/auth/session-provider";
import type { MenuNode } from "@/features/auth/types";

/**
 * Pencarian menjangkau nama layar, bukan hanya nama domain: yang dicari
 * orang adalah "Kas Keluar", dan mereka belum tentu tahu itu ada di bawah
 * Keuangan. Domain tetap tampil bila namanya sendiri ATAU salah satu
 * layarnya cocok. Kata kunci kosong mengembalikan seluruh domain apa adanya.
 *
 * Diekstrak dan diuji terpisah mengikuti pola `getVisibleTabs`/`isTabActive`
 * di `bottom-tab.tsx`: ada dua cabang nyata (kosong vs tidak, domain vs
 * layar) yang lebih murah diuji lewat unit test daripada dibaca ulang setiap
 * review.
 *
 * Normalisasi kata kunci terjadi DI SINI, bukan di pemanggil. Fungsi ini
 * diekspor, jadi kontraknya tidak boleh berupa syarat tak tertulis
 * ("panggil `.trim().toLowerCase()` dulu") yang hanya diketahui satu
 * pemanggil yang kebetulan ada hari ini — pemanggil kedua akan
 * melewatkannya, dan hasilnya bukan galat melainkan daftar kosong yang
 * terlihat seperti "tidak ada yang cocok".
 */
export function filterDomains(
  domains: MenuNode[],
  keyword: string,
): MenuNode[] {
  const needle = keyword.trim().toLowerCase();

  if (!needle) return domains;

  return domains.filter(
    (domain) =>
      domain.name.toLowerCase().includes(needle) ||
      domain.children.some((leaf) => leaf.name.toLowerCase().includes(needle)),
  );
}

export function ModuleGrid() {
  const session = useSession();

  const [pickDomain, setPickDomain] = useState<MenuNode | null>(null);
  const [searchData, setSearchData] = useState("");

  const onCloseSheet = () => {
    setPickDomain(null);
  };

  const domains = filterDomains(session.menu, searchData);

  return (
    <div className="pb-6">
      <PageHeader
        title="Semua modul"
        subtitle={`${session.menu.length} domain · ${session.menu.reduce(
          (total, domain) => total + domain.children.length,
          0,
        )} layar`}
        backHref="/"
      />

      <div className="px-gutter pb-4">
        <div className="border-input bg-background flex h-11 items-center gap-2 rounded-xl border px-3">
          <Search
            className="text-muted-foreground size-4 shrink-0"
            aria-hidden
          />

          <input
            value={searchData}
            onChange={(event) => setSearchData(event.target.value)}
            placeholder="Cari modul atau layar"
            aria-label="Cari modul atau layar"
            className="h-full w-full bg-transparent text-base outline-none"
          />
        </div>
      </div>

      {domains.length === 0 ? (
        <p className="text-muted-foreground px-gutter py-10 text-center text-sm">
          Tidak ada modul yang cocok dengan &ldquo;{searchData}&rdquo;.
        </p>
      ) : (
        <ul className="grid grid-cols-3 gap-4 px-gutter">
          {domains.map((domain) => {
            const Icon = MENU_ICON[domain.slug];

            return (
              <li key={domain.publicId}>
                <button
                  type="button"
                  onClick={() => setPickDomain(domain)}
                  className="flex w-full flex-col items-center gap-1.5 text-center"
                >
                  <span className="bg-muted flex size-14 items-center justify-center rounded-2xl">
                    {Icon ? <Icon className="size-6" aria-hidden /> : null}
                  </span>

                  <span className="text-xs leading-tight">{domain.name}</span>
                  <span className="text-muted-foreground text-2xs">
                    {domain.children.length} layar
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-muted-foreground px-gutter pt-8 text-xs">
        Modul yang tidak Anda pegang tidak ditampilkan.
      </p>

      <BottomSheet
        isOpen={pickDomain !== null}
        title={pickDomain?.name ?? ""}
        subtitle={
          pickDomain
            ? `${pickDomain.children.length} layar · ${pickDomain.slug}`
            : undefined
        }
        onClose={onCloseSheet}
      >
        <ul className="divide-border divide-y">
          {pickDomain?.children.map((leaf) => (
            <li key={leaf.publicId}>
              <Link
                href={menuHref(pickDomain.slug, leaf.slug)}
                onClick={onCloseSheet}
                className="flex h-14 items-center justify-between px-gutter"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm">{leaf.name}</span>
                  <span className="text-muted-foreground block truncate text-2xs">
                    {leaf.slug}
                  </span>
                </span>

                <ChevronRight
                  className="text-muted-foreground size-4 shrink-0"
                  aria-hidden
                />
              </Link>
            </li>
          ))}
        </ul>
      </BottomSheet>
    </div>
  );
}
