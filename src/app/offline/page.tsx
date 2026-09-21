import type { Metadata } from "next";
import { connection } from "next/server";

import { shellWidth } from "@/components/layout/shell-width";
import { cn } from "@/lib/utils";

/**
 * Halaman fallback saat navigasi gagal karena tidak ada jaringan.
 *
 * Satu-satunya halaman yang di-precache service worker. Karena itu isinya
 * WAJIB statis dan nol data: halaman ini tersimpan di CacheStorage perangkat
 * dan bertahan melewati logout, sehingga apa pun yang dirender di sini bisa
 * dibaca user berikutnya di perangkat bersama seperti PC sekretariat.
 *
 * Jangan menambahkan fetch, `cookies()`, atau apa pun yang bergantung user
 * ke halaman ini.
 *
 * Halaman ini dirender dinamis karena CSP berbasis nonce menuntutnya (lihat
 * src/app/page.tsx). Satu catatan yang disadari: salinan yang disimpan service
 * worker membawa nonce yang beku selamanya. Untuk halaman tanpa data dan tanpa
 * masukan user seperti ini, nonce yang berulang tidak membuka jalan serangan —
 * tidak ada apa pun di sini yang bisa disuntik penyerang.
 */
export const metadata: Metadata = {
  title: "Tidak ada koneksi",
};

export default async function OfflinePage() {
  await connection();

  return (
    <div
      className={cn(
        shellWidth,
        "flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center",
      )}
    >
      <h1 className="text-2xl font-semibold">Tidak ada koneksi</h1>
      <p className="text-muted-foreground max-w-md text-sm">
        Halaman ini butuh jaringan dan perangkat Anda sedang offline. Periksa
        koneksi, lalu muat ulang.
      </p>
    </div>
  );
}
