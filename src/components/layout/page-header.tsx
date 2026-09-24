import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/common/control/button";
import { cn } from "@/lib/utils";

/**
 * Header satu layar: slot kiri, judul, satu aksi di kanan.
 *
 * Slot kiri berisi tombol kembali (`backHref`) atau `leading` (Beranda:
 * `AppIdentity`), dan HANYA tampil < lg — keputusan user 2026-09-22. Di
 * desktop sidebar sudah menjawab "di mana aku" dan memuat identitas aplikasi,
 * jadi keduanya hanya mengulang. Layar tidak menulis breakpoint.
 *
 * `title` opsional: Beranda tidak punya judul di header — `h1`-nya sapaan.
 *
 * `backHref` berupa tautan, bukan `router.back()`. Layar ini bisa dibuka
 * langsung dari notifikasi push atau dari tautan yang dibagikan, dan pada
 * kasus itu `back()` melempar user keluar dari aplikasi.
 */
export function PageHeader({
  title,
  subtitle,
  backHref,
  onBack,
  isBackPersistent = false,
  leading,
  action,
}: {
  title?: string;
  subtitle?: string;
  backHref?: string;
  /**
   * Dipanggil sebelum tautan kembali dijalankan; memanggil `preventDefault()`
   * di dalamnya MEMBATALKAN perpindahan. Dipakai layar isian untuk menanyakan
   * "buang perubahan?" lebih dulu.
   *
   * Tetap sebuah `<a href>`, bukan tombol: klik-kanan "buka di tab baru",
   * pratinjau tautan, dan status bar peramban tetap bekerja.
   */
  onBack?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
  /**
   * Tombol kembali tetap tampil di ≥ lg.
   *
   * Bawaannya disembunyikan karena sidebar sudah menjawab "di mana aku". Di
   * LAYAR ISIAN itu tidak cukup: sidebar menunjuk layar daftarnya, dan sejak
   * bottom tab tidak dirender di rute form, tombol ini adalah satu-satunya
   * jalan keluar yang kita sediakan sendiri — jalan yang menanyakan "buang
   * perubahan?" lebih dulu.
   */
  isBackPersistent?: boolean;
  leading?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <header
      className={cn(
        "flex items-center gap-3 px-gutter pt-[max(1rem,env(safe-area-inset-top))] pb-3",
        // Tanpa judul, baris ini di ≥ lg hanya berisi aksi (slot kiri
        // disembunyikan di lg) — "lonceng sendirian". Di Beranda desktop
        // aksi itu pindah ke `DashboardHeader`.
        !title && !subtitle && "lg:hidden",
      )}
    >
      <div className={isBackPersistent ? "contents" : "contents lg:hidden"}>
        {backHref ? (
          <Link
            href={backHref}
            onClick={onBack}
            aria-label="Kembali"
            // Tampil 36px; `after:` memperluas area sentuh tak terlihat ke 48px
            // tanpa membesarkan layout.
            className="border-border hover:bg-muted active:bg-accent focus-visible:ring-ring relative flex size-control shrink-0 items-center justify-center rounded-full border transition-colors outline-none after:absolute after:-inset-1.5 focus-visible:ring-2"
          >
            <ArrowLeft className="size-4" aria-hidden />
          </Link>
        ) : (
          leading
        )}
      </div>

      <div className="min-w-0 flex-1">
        {title ? (
          <h1 className="truncate text-lead font-semibold" title={title}>
            {title}
          </h1>
        ) : null}
        {subtitle ? (
          <p
            className="text-muted-foreground truncate text-body"
            title={subtitle}
          >
            {subtitle}
          </p>
        ) : null}
      </div>

      {action}
    </header>
  );
}

/**
 * Aksi "tambah" di kanan header: lingkaran ikon 36px di HP/tablet (sama
 * dengan tombol kembali di kiri — kotak 36px terlihat lebih besar daripada
 * lingkaran 36px), tombol berlabel "Tambah" di desktop, tempat ruangnya ada
 * dan ikon plus sendirian di ujung tabel lebar mudah terlewat.
 *
 * `<Link>` bergaya tombol, bukan `Button`: ini perpindahan halaman.
 * `aria-label` memuat teks yang terlihat ("Tambah …"), jadi nama aksesibelnya
 * tetap cocok dengan yang dibaca mata.
 */
export function PageHeaderAdd({
  href,
  label,
}: {
  href: string;
  /** Nama lengkap aksi untuk pembaca layar, mis. "Tambah jemaat". */
  label: string;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={cn(
        buttonVariants({ size: "icon" }),
        "cursor-pointer rounded-full lg:w-auto lg:gap-1.5 lg:rounded-control lg:px-3",
      )}
    >
      <Plus aria-hidden />
      <span className="hidden lg:inline">Tambah</span>
    </Link>
  );
}
