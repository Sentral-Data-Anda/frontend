import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { SectionHeader } from "./section-header";

type QueryState = {
  isPending: boolean;
  error: Error | null;
  refetch: () => unknown;
};

/**
 * Kartu satu widget dashboard: putih, radius 12, `shadow-sm`, padding 14 —
 * gaya kartu kas yang sudah di-review.
 *
 * `query`: selama memuat tampil kerangka setinggi `minHeight` (tinggi isi
 * sebenarnya, supaya kartu di bawahnya tidak melompat); galat = satu baris +
 * "Coba lagi" di kartu ini saja, tidak menjatuhkan halaman.
 */
export function DashboardCard({
  title,
  actionLabel,
  actionHref,
  query,
  minHeight = "min-h-24",
  children,
}: {
  title: string;
  actionLabel?: string;
  actionHref?: string;
  query?: QueryState;
  /** Kelas `min-h-*` untuk kerangka memuat. */
  minHeight?: string;
  children: ReactNode;
}) {
  return (
    <section className="bg-card min-w-0 rounded-lg p-3.5 shadow-sm">
      <SectionHeader
        title={title}
        actionLabel={actionLabel}
        actionHref={actionHref}
      />

      {query?.isPending ? (
        <div
          role="status"
          aria-label={`Memuat ${title}`}
          className={cn("space-y-2", minHeight)}
        >
          <span className="bg-muted block h-4 w-3/4 animate-pulse rounded-control" />
          <span className="bg-muted block h-4 w-1/2 animate-pulse rounded-control" />
        </div>
      ) : query?.error ? (
        <p className="text-muted-foreground flex items-center gap-2 text-body">
          Gagal memuat.
          <button
            type="button"
            onClick={() => void query.refetch()}
            className="text-foreground inline-flex min-h-6 items-center font-medium underline-offset-2 hover:underline"
          >
            Coba lagi
          </button>
        </p>
      ) : (
        children
      )}
    </section>
  );
}

/** Satu baris "tidak ada …" — widget kosong tetap tampil, tidak hilang. */
export function DashboardEmpty({ children }: { children: ReactNode }) {
  return <p className="text-muted-foreground text-body">{children}</p>;
}

/** Daftar baris di dalam kartu dashboard, dipisah garis tipis. */
export function DashboardList({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <ul aria-label={label} className="divide-border divide-y">
      {children}
    </ul>
  );
}

/**
 * Satu baris. `href` → judul menjadi tautan yang meregang ke seluruh baris
 * (satu target, satu nama aksesibel = judulnya).
 */
export function DashboardRow({
  title,
  meta,
  leading,
  trailing,
  href,
}: {
  title: ReactNode;
  meta?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  href?: string;
}) {
  return (
    <li className="relative flex min-h-12 items-center gap-3 py-2">
      {leading}

      <div className="min-w-0 flex-1">
        <p className="truncate text-body font-medium">
          {href ? (
            <Link
              href={href}
              className="outline-none after:absolute after:inset-0 after:rounded-control focus-visible:after:ring-2 focus-visible:after:ring-ring"
            >
              {title}
            </Link>
          ) : (
            title
          )}
        </p>
        {meta ? (
          <p className="text-muted-foreground truncate text-caption tabular-nums">
            {meta}
          </p>
        ) : null}
      </div>

      {trailing ? (
        <div className="flex shrink-0 items-center gap-2 text-body tabular-nums">
          {trailing}
        </div>
      ) : null}
    </li>
  );
}
