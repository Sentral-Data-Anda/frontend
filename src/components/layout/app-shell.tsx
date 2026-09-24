import { cookies } from "next/headers";

import { BottomTab } from "./bottom-tab";
import { Sidebar } from "./sidebar";
import { SIDEBAR_COOKIE, isSidebarCollapsed } from "./sidebar-collapse";

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
export async function AppShell({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const isCollapsed = isSidebarCollapsed(
    cookieStore.get(SIDEBAR_COOKIE)?.value,
  );

  return (
    // `bg-canvas-aurora` (globals.css): kanvas + gradasi brand + butiran, di
    // lapisan fixed — satu tempat untuk seluruh layar `(app)`.
    <div className="bg-canvas-aurora flex min-h-dvh flex-col lg:flex-row">
      <Sidebar defaultCollapsed={isCollapsed} />

      {/*
        Di bawah lg, BottomTab sticky ke bawah viewport sebagai flex-sibling
        terakhir, dan seluruh halaman scroll di level dokumen (bukan di dalam
        `main`). Karena sticky tetap memakai ruang di aliran, nav sudah punya
        tempatnya sendiri di ujung dokumen — `main` TIDAK boleh menambah
        padding setinggi nav lagi, itu menghitung ruang yang sama dua kali dan
        menyisakan lubang setinggi satu tab bar di atas nav.

        Alternatif yang ditolak: `overflow-y-auto` pada `main` supaya nav
        jadi flex item biasa tanpa `sticky`. Itu memindahkan scroll ke
        container internal dan mematikan perilaku scroll native iOS —
        kolapsnya address bar, momentum scroll, pull-to-refresh. Scroll
        dokumen dipertahankan; sidebar desktop yang punya scroll sendiri.
      */}
      {/* lg:pl-3.5 = tonjolan tombol ciut di tepi sidebar (14px), supaya
          konten tidak menempel padanya saat kolom konten mengisi penuh. */}
      <main className="min-w-0 flex-1 lg:pl-3.5">{children}</main>

      <BottomTab />
    </div>
  );
}
