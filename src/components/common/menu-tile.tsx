import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import { DomainIcon } from "@/components/common/domain-tile";

/**
 * Tile bento satu layar di halaman domain dan hasil cari `/modul`: ikon layar
 * ber-tint domain, judul, penjelasan maks. dua baris. `domainLabel` (hasil
 * cari) menaruh nama domain di samping ikon sebagai konteks. Seluruh tile satu `Link`; garis tipis
 * `ring-foreground/10` sama dengan kartu kas di Beranda.
 */
export function MenuTile({
  href,
  domainSlug,
  domainLabel,
  icon,
  title,
  description,
}: {
  href: string;
  /** Slug domain, untuk tint (dan ikon cadangan bila `icon` kosong). */
  domainSlug: string;
  domainLabel?: string;
  icon?: LucideIcon;
  title: string;
  description?: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="bg-card ring-foreground/10 hover:bg-accent focus-visible:ring-ring flex h-full flex-col gap-2.5 rounded-lg p-3.5 ring-1 outline-none focus-visible:ring-2 motion-safe:transition motion-safe:active:scale-97"
      >
        <span className="flex items-center gap-2">
          <DomainIcon slug={domainSlug} icon={icon} size="sm" />

          {domainLabel ? (
            <span
              className="text-muted-foreground truncate text-caption"
              title={domainLabel}
            >
              {domainLabel}
            </span>
          ) : null}
        </span>

        <span className="min-w-0">
          <span className="block text-body font-medium">{title}</span>

          {description ? (
            <span className="text-muted-foreground mt-0.5 line-clamp-2 text-caption">
              {description}
            </span>
          ) : null}
        </span>
      </Link>
    </li>
  );
}

/**
 * Wadah `MenuTile`: dua kolom di ponsel, tiga kolom begitu kontennya ≥ 36rem
 * (tablet). Container query, bukan breakpoint viewport — layar tidak menulis
 * `md:`. `auto-rows-fr` menyamakan tinggi tile satu baris.
 */
export function MenuTileGrid({
  label,
  children,
}: {
  /** Nama daftar untuk pembaca layar, mis. "Layar Kejemaatan". */
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="@container">
      <ul
        aria-label={label}
        className="grid auto-rows-fr grid-cols-2 gap-3 @xl:grid-cols-3"
      >
        {children}
      </ul>
    </div>
  );
}
