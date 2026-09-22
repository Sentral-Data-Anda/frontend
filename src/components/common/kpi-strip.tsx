import type { ReactNode } from "react";

/**
 * Strip angka ringkas di puncak dashboard. Satu kartu putih; sel dipisah garis
 * 1px (celah `gap-px` di atas `bg-border`), bukan kartu terpisah.
 *
 * 2×2 di kolom < 55rem, satu baris `count` kolom di atasnya (ambang sama
 * dengan `DashboardGrid`). Jumlah sel ganjil di 2×2 → sel terakhir selebar
 * strip, supaya tidak pernah ada lubang (dashboard-desktop.md §3a). Tidak
 * digeser (carousel): sel di luar layar tidak ditemukan.
 */
export function KpiStrip({
  label,
  count,
  children,
}: {
  label: string;
  /** Jumlah sel — lebar kolom di baris tunggal. */
  count: number;
  children: ReactNode;
}) {
  return (
    <div className="@container">
      <section
        aria-label={label}
        style={{ "--kpi-cols": count } as React.CSSProperties}
        className="bg-border grid grid-cols-2 gap-px overflow-hidden rounded-lg shadow-sm [&>*:last-child:nth-child(odd)]:col-span-2 @min-[55rem]:grid-cols-[repeat(var(--kpi-cols),minmax(0,1fr))] @min-[55rem]:[&>*:last-child:nth-child(odd)]:col-span-1"
      >
        {children}
      </section>
    </div>
  );
}

/**
 * Satu angka. Urutan baca pembaca layar = "label, nilai, keterangan". Angka
 * maks 14px (`text-title` semibold, `tabular-nums`) — hierarki lewat bobot
 * dan warna, bukan ukuran.
 */
export function KpiCell({
  label,
  value,
  hint,
  isLoading = false,
}: {
  label: string;
  value?: ReactNode;
  hint?: ReactNode;
  isLoading?: boolean;
}) {
  return (
    <div className="bg-card min-w-0 p-3.5">
      <p className="text-muted-foreground truncate text-caption font-semibold tracking-wide uppercase">
        {label}
      </p>
      {isLoading ? (
        <span className="bg-muted mt-1 block h-5 w-24 animate-pulse rounded-control" />
      ) : (
        <p className="mt-0.5 truncate text-title font-semibold tabular-nums">
          {value ?? "—"}
        </p>
      )}
      {hint ? (
        <p className="text-muted-foreground truncate text-caption">{hint}</p>
      ) : null}
    </div>
  );
}
