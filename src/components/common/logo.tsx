import Image from "next/image";
import Link from "next/link";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

/**
 * Lencana logo SADA untuk latar TERANG (putih, muted).
 *
 * Aset logo dari user berwarna abu-kebiruan terang (~#d4dcec) yang dirancang
 * untuk latar gelap: di atas putih kontrasnya hanya 1.38:1 dan garis tepi
 * navy-nya sub-piksel pada ukuran lencana. Karena itu ikon diletakkan di atas
 * bidang `--primary` — latar yang memang dimaksud aset itu, sama seperti ikon
 * PWA — bukan diwarnai ulang: ikon di atas primary 6.13:1, bidangnya di atas
 * putih 8.44:1.
 *
 * Sumbernya `public/brand/logo-icon.png` 256px (ekspor dari PNG 3000px yang
 * terbungkus di `ic_logo.svg`); `next/image` menurunkan ukuran 1x/2x dari
 * `sizes`.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn("flex items-center gap-2 font-semibold", className)}
    >
      <LogoMark className="size-8 rounded-md" />
      <span className="text-title">{siteConfig.shortName}</span>
    </Link>
  );
}

/**
 * Ikon logo di bidang navy, tanpa teks — penanda aplikasi di header Beranda
 * (36px, sudut kontrol, sama dengan kotak lain di header) dan di `Logo`.
 * Dekoratif: nama aplikasi sudah tertulis di sebelahnya.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "bg-primary flex size-9 shrink-0 items-center justify-center rounded-control",
        className,
      )}
    >
      <Image
        src="/brand/logo-icon.png"
        alt=""
        width={28}
        height={28}
        sizes="28px"
        className="size-3/4"
        priority
      />
    </span>
  );
}

/**
 * Logo-nama asli dari user, apa adanya — tanpa bidang, tanpa teks tambahan.
 *
 * Asetnya abu-kebiruan terang (~#d4dcec). Di atas putih kontrasnya hanya
 * ~1.6:1. Itu KEPUTUSAN USER (revisi login 2026-09-21): user sudah diberi tahu
 * dan memilih logo asli dibanding ikon di bidang navy — jangan diwarnai ulang
 * atau diberi kotak. Nama aplikasi tetap terbaca pembaca layar lewat `alt`.
 *
 * Lebar bawaan 96px (tinggi ~45px) — sebanding dengan skala teks 12/14px.
 */
export function LogoWordmark({ className }: { className?: string }) {
  return (
    <Image
      src="/brand/logo-wordmark.png"
      alt={siteConfig.shortName}
      width={496}
      height={232}
      sizes="160px"
      className={cn("h-auto w-24", className)}
      priority
    />
  );
}
