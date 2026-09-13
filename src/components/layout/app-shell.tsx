import { BottomTab } from "./bottom-tab";

/**
 * Kerangka setiap layar di dalam `(app)`.
 *
 * Layar TIDAK BOLEH tahu di mana navigasinya berada. Tidak ada `pb-20` di
 * layar untuk memberi ruang bottom tab, tidak ada `ml-64` untuk sidebar —
 * jarak itu milik berkas ini. Aturan itulah yang membuat tata letak desktop
 * nanti hanya mengubah satu berkas, bukan 61.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <main className="flex-1">{children}</main>

      <BottomTab />
    </div>
  );
}
