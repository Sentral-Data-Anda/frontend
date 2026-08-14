import type { Metadata } from "next";

import { Container } from "@/components/layout/container";

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
 */
export const metadata: Metadata = {
  title: "Tidak ada koneksi",
};

export default function OfflinePage() {
  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-2xl font-semibold">Tidak ada koneksi</h1>
      <p className="text-muted-foreground max-w-md text-sm">
        Halaman ini butuh jaringan dan perangkat Anda sedang offline. Periksa
        koneksi, lalu muat ulang.
      </p>
    </Container>
  );
}
