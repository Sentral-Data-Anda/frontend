import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type QueryState = {
  isPending: boolean;
  /** Sedang memuat ulang (mis. setelah "Coba lagi") — tombolnya menunggu. */
  isFetching?: boolean;
  error: Error | null;
  refetch: () => unknown;
};

/**
 * Panel satu widget dashboard, bahasa C (dashboard-desktop.md §10.9): putih,
 * garis hairline, radius 12, tanpa bayangan; padding 24 di ≥ lg (16 di HP);
 * judul 12/600 kapital, aksi kanan 12px.
 *
 * `query`: selama memuat tampil kerangka setinggi `minHeight` (tinggi isi
 * sebenarnya, supaya panel di bawahnya tidak melompat); galat = satu baris +
 * "Coba lagi" di panel ini saja — tombolnya nonaktif "Memuat…" selama
 * memuat ulang, lalu isi berganti. `isDummy` → tanda "contoh data".
 */
export function DashboardCard({
  title,
  actionLabel,
  actionHref,
  trailing,
  query,
  isDummy = false,
  minHeight = "min-h-24",
  children,
}: {
  title: string;
  actionLabel?: string;
  actionHref?: string;
  /** Isi kanan kepala panel selain tautan (legenda, hitungan, navigasi). */
  trailing?: ReactNode;
  query?: QueryState;
  isDummy?: boolean;
  /** Kelas `min-h-*` untuk kerangka memuat. */
  minHeight?: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-label={title}
      className="bg-card border-hairline min-w-0 rounded-lg border p-4 lg:p-6"
    >
      <div className="mb-4 flex min-h-6 items-center justify-between gap-3">
        <h2 className="text-muted-foreground flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-body font-semibold tracking-wide uppercase">
          <span className="truncate">{title}</span>
          {isDummy ? <Badge variant="sample">contoh data</Badge> : null}
        </h2>

        <div className="flex shrink-0 items-center gap-3">
          {trailing}
          {actionLabel && actionHref ? (
            <Link
              href={actionHref}
              className="text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex min-h-6 items-center rounded-control text-body font-medium underline-offset-2 outline-none hover:underline focus-visible:ring-2"
            >
              {actionLabel}
            </Link>
          ) : null}
        </div>
      </div>

      {query?.isPending ? (
        <div
          role="status"
          aria-label={`Memuat ${title}`}
          className={cn("space-y-3", minHeight)}
        >
          <span className="bg-muted block h-3 w-3/4 animate-pulse rounded-control" />
          <span className="bg-muted block h-3 w-1/2 animate-pulse rounded-control" />
          <span className="bg-muted block h-3 w-2/3 animate-pulse rounded-control" />
        </div>
      ) : query?.error ? (
        // Tinggi galat = tinggi kerangka, bukan satu baris teks. Kartu yang
        // menciut jadi 40px membuat kolomnya terlihat pecah, dan tata letak
        // melompat lagi begitu "Coba lagi" berhasil.
        <p
          role="alert"
          className={cn(
            "text-muted-foreground flex items-center gap-2 text-body",
            minHeight,
          )}
        >
          Gagal memuat.
          <button
            type="button"
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
            className="text-foreground focus-visible:ring-ring inline-flex min-h-6 items-center rounded-control font-medium underline-offset-2 outline-none hover:underline focus-visible:ring-2 disabled:no-underline disabled:opacity-60"
          >
            {query.isFetching ? "Memuat…" : "Coba lagi"}
          </button>
        </p>
      ) : (
        children
      )}
    </section>
  );
}

/** Daftar baris di dalam panel, dipisah hairline. */
export function DashboardList({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <ul aria-label={label} className="divide-hairline -mx-2.5 divide-y">
      {children}
    </ul>
  );
}

/**
 * Satu baris. `href` → seluruh baris bisa diklik (tautan judul diregangkan):
 * hover bidang tipis + chevron muncul, cincin fokus di seluruh baris
 * (§10.7). Judul/meta string mendapat `title` (teks lengkap saat terpotong).
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
    <li
      className={cn(
        "group/row relative flex min-h-11 items-center gap-3 rounded-control px-2.5 py-2",
        href && "hover:bg-muted pr-7 transition-colors",
      )}
    >
      {leading}

      <div className="min-w-0 flex-1">
        <p
          className="truncate text-body font-medium"
          title={typeof title === "string" ? title : undefined}
        >
          {href ? (
            <Link
              href={href}
              className="focus-visible:ring-ring outline-none after:absolute after:inset-0 after:rounded-control focus-visible:after:ring-2"
            >
              {title}
            </Link>
          ) : (
            title
          )}
        </p>
        {meta ? (
          <p
            className="text-muted-foreground truncate text-caption tabular-nums"
            title={typeof meta === "string" ? meta : undefined}
          >
            {meta}
          </p>
        ) : null}
      </div>

      {trailing ? (
        <div className="flex shrink-0 items-center gap-2 text-body tabular-nums">
          {trailing}
        </div>
      ) : null}

      {href ? (
        <ChevronRight
          className="text-muted-foreground absolute top-1/2 right-2 size-3.5 -translate-y-1/2 opacity-0 transition-opacity group-hover/row:opacity-100"
          aria-hidden
        />
      ) : null}
    </li>
  );
}
