import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { DomainIcon } from "@/components/common/domain-tile";

/**
 * Kartu satu layar di halaman domain: ikon ber-tint, judul, penjelasan
 * opsional, chevron. Seluruh kartu satu `Link`, jadi target sentuhnya satu
 * kartu penuh (64px), bukan hanya teks.
 *
 * `iconSlug` adalah slug DOMAIN: layar belum punya ikon sendiri.
 */
export function MenuCard({
  href,
  iconSlug,
  title,
  description,
}: {
  href: string;
  iconSlug: string;
  title: string;
  description?: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="border-border bg-card focus-visible:ring-ring/50 flex items-center gap-3 rounded-lg border p-3.5 outline-none focus-visible:ring-3"
      >
        <DomainIcon slug={iconSlug} size="sm" />

        <span className="min-w-0 flex-1">
          <span className="block truncate text-body font-medium">{title}</span>

          {description ? (
            <span className="text-muted-foreground block truncate text-caption">
              {description}
            </span>
          ) : null}
        </span>

        <ChevronRight
          className="text-muted-foreground size-4 shrink-0"
          aria-hidden
        />
      </Link>
    </li>
  );
}

/**
 * Wadah `MenuCard`: satu kolom di ponsel, dua kolom begitu kontennya
 * ≥ 28rem. Container query, bukan breakpoint viewport — layar tidak menulis
 * `md:`, dan lebar yang menentukan adalah kolom konten, bukan jendela.
 */
export function MenuCardGrid({
  label,
  children,
}: {
  /** Nama daftar untuk pembaca layar, mis. "Layar Kejemaatan". */
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="@container">
      <ul aria-label={label} className="grid gap-3 @md:grid-cols-2 @md:gap-x-4">
        {children}
      </ul>
    </div>
  );
}
