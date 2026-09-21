import { BottomTab } from "./bottom-tab";
import { shellWidth } from "./shell-width";
import { Sidebar } from "./sidebar";

/**
 * Kerangka setiap layar di dalam `(app)`.
 *
 * Layar TIDAK BOLEH tahu di mana navigasinya berada. Tidak ada `pb-20` di
 * layar untuk memberi ruang bottom tab, tidak ada `ml-64` untuk sidebar —
 * jarak itu milik berkas ini.
 *
 * Dua navigasi ditukar lewat CSS (`lg:hidden` / `hidden lg:flex`), bukan
 * `matchMedia`: server tidak tahu lebar layar, jadi percabangan di JS pasti
 * menghasilkan hydration mismatch atau kedipan nav yang salah.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      <Sidebar />

      {/*
        Di bawah lg, BottomTab sticky ke bawah viewport sebagai flex-sibling
        terakhir, dan seluruh halaman scroll di level dokumen (bukan di dalam
        `main`). Padding bawah ini mencegah ekor konten tertutup nav; tingginya
        dibaca dari token `--bottom-tab-height` yang juga dipakai `<nav>` di
        BottomTab. Di lg bottom tab hilang, jadi padding-nya ikut hilang.

        Alternatif yang ditolak: `overflow-y-auto` pada `main` supaya nav
        jadi flex item biasa tanpa `sticky`. Itu memindahkan scroll ke
        container internal dan mematikan perilaku scroll native iOS —
        kolapsnya address bar, momentum scroll, pull-to-refresh. Scroll
        dokumen dipertahankan; sidebar desktop yang punya scroll sendiri.
      */}
      <main className="min-w-0 flex-1 pb-[calc(var(--bottom-tab-height)+env(safe-area-inset-bottom))] lg:pb-0">
        <div className={shellWidth}>{children}</div>
      </main>

      <BottomTab />
    </div>
  );
}
