import Link from "next/link";

import { buttonVariants } from "@/components/common/button";
import { PageHeader } from "@/components/layout/page-header";

/**
 * 404 yang TETAP BERADA DI DALAM app shell.
 *
 * `src/app/not-found.tsx` yang lama duduk di root, di luar `(app)`, jadi ia
 * ikut membuang `AppShell` beserta bottom tab-nya. Efeknya buruk justru pada
 * kondisi yang paling sering terjadi hari ini: dari 63 tujuan navigasi yang
 * dijanjikan Fase 1, hanya 2 yang sudah punya layar. Menekan tab "Ibadah"
 * membawa user ke halaman telanjang tanpa navigasi apa pun — aplikasi terlihat
 * runtuh, padahal yang terjadi hanya "layarnya belum dibangun".
 *
 * Berkas ini yang menutup selisih itu tanpa membuat 61 berkas kosong: shell
 * bertahan, bottom tab tetap ada, dan user bisa langsung pindah ke modul lain.
 * `src/app/not-found.tsx` sengaja dibiarkan apa adanya — ia melayani rute di
 * LUAR app shell, tempat bottom tab memang tidak punya arti.
 */
export default function NotFound() {
  return (
    <div>
      <PageHeader title="Layar belum tersedia" backHref="/" />

      <div className="flex flex-col items-start gap-3 px-gutter">
        <p className="text-muted-foreground text-body">
          Layar ini belum dibangun. Menu dan hak aksesnya sudah aktif, tampilan
          serta datanya menyusul pada tahap berikutnya.
        </p>

        <p className="text-muted-foreground text-body">
          Modul lain tetap bisa dibuka lewat menu navigasi.
        </p>

        <Link href="/modul" className={buttonVariants({ variant: "outline" })}>
          Lihat semua modul
        </Link>
      </div>
    </div>
  );
}
