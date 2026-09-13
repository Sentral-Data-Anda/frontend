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
      {/*
        BottomTab sticky ke bawah viewport sebagai flex-sibling terakhir di
        sini, dan seluruh halaman scroll di level dokumen (bukan di dalam
        `main`). Tanpa padding bawah ini, ekor konten yang panjang akan
        tertutup nav selama scroll — baru sejajar dengan posisi aslinya saat
        mencapai akhir dokumen. `3.5rem` = `h-14` pada `<nav>` di BottomTab;
        kalau tinggi tab berubah, angka ini ikut berubah.

        Alternatif yang ditolak: `overflow-y-auto` pada `main` supaya nav
        jadi flex item biasa tanpa `sticky`. Itu memindahkan scroll ke
        container internal dan mematikan perilaku scroll native iOS —
        kolapsnya address bar, momentum scroll, pull-to-refresh. Scroll
        dokumen dipertahankan.
      */}
      <main className="flex-1 pb-[calc(3.5rem+env(safe-area-inset-bottom))]">
        {children}
      </main>

      <BottomTab />
    </div>
  );
}
