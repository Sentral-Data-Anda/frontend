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
        mencapai akhir dokumen. Tingginya dibaca dari token
        `--bottom-tab-height` di globals.css — token yang sama yang dipakai
        `<nav>` di BottomTab, jadi keduanya tidak bisa lagi berbeda diam-diam.

        Alternatif yang ditolak: `overflow-y-auto` pada `main` supaya nav
        jadi flex item biasa tanpa `sticky`. Itu memindahkan scroll ke
        container internal dan mematikan perilaku scroll native iOS —
        kolapsnya address bar, momentum scroll, pull-to-refresh. Scroll
        dokumen dipertahankan.
      */}
      {/*
        Di desktop isi layar menjadi satu kolom ter-center, bukan melebar
        sampai tepi jendela: seluruh layar dirancang untuk 390px, dan baris
        daftar setinggi 56px yang direntangkan ke 1440px menyisakan lautan
        kosong antara nama dan badge statusnya.

        Sidebar TIDAK dibangun di sini. Bottom tab tetap membentang penuh
        sebagaimana mestinya sebuah tab bar, dan keputusan tata letak desktop
        yang sebenarnya (sidebar + breadcrumb) belum diambil — lihat §12
        "Desktop" di dokumen desain slicing.
      */}
      <main className="flex-1 pb-[calc(var(--bottom-tab-height)+env(safe-area-inset-bottom))]">
        <div className="mx-auto w-full max-w-lg">{children}</div>
      </main>

      <BottomTab />
    </div>
  );
}
