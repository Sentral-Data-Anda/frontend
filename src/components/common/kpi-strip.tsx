import type { ReactNode } from "react";

/**
 * Strip angka ringkas di puncak dashboard. Satu kartu putih; sel dipisah garis
 * 1px (celah `gap-px` di atas `bg-border`), bukan kartu terpisah.
 *
 * 2×2 di kolom sempit. Jumlah sel ganjil → sel terakhir selebar strip, supaya
 * tidak pernah ada lubang (dashboard-desktop.md §3a).
 */
export function KpiStrip({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-label={label}
      className="bg-border grid grid-cols-2 gap-px overflow-hidden rounded-lg shadow-sm [&>*:last-child:nth-child(odd)]:col-span-2"
    >
      {children}
    </section>
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
