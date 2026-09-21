"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { DomainTile } from "@/components/common/domain-tile";
import { Input } from "@/components/common/input";
import { PageHeader } from "@/components/layout/page-header";
import { domainEntryHref } from "@/config/menu";
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

  const [searchData, setSearchData] = useState("");

  const domains = filterDomains(session.menu, searchData);

  return (
    <div className="pb-6">
      <PageHeader title="Semua modul" backHref="/" />

      <div className="px-gutter pb-4">
        <div className="relative">
          <Search
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2"
            aria-hidden
          />

          <Input
            type="search"
            value={searchData}
            onChange={(event) => setSearchData(event.target.value)}
            placeholder="Cari modul atau layar"
            aria-label="Cari modul atau layar"
            className="pl-8"
          />
        </div>
      </div>

      {domains.length === 0 ? (
        <p className="text-muted-foreground px-gutter py-10 text-center text-body">
          Tidak ada modul yang cocok dengan &ldquo;{searchData}&rdquo;.
        </p>
      ) : (
        <ul className="grid grid-cols-3 gap-4 px-gutter">
          {domains.map((domain) => (
            <li key={domain.publicId}>
              <Link href={domainEntryHref(domain)} className="block">
                <DomainTile slug={domain.slug} label={domain.name} />
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p className="text-muted-foreground px-gutter pt-8 text-caption">
        Modul yang tidak Anda pegang tidak ditampilkan.
      </p>
    </div>
  );
}
