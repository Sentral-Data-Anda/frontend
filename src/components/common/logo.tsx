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
      <span className="bg-primary flex size-8 items-center justify-center rounded-md">
        <Image
          src="/brand/logo-icon.png"
          alt=""
          width={24}
          height={24}
          sizes="24px"
          className="size-6"
          priority
        />
      </span>
      <span className="text-base">{siteConfig.shortName}</span>
    </Link>
  );
}

/**
 * Logo + nama "SADA", HANYA untuk latar gelap (`--primary`): di sana
 * kontrasnya 5.23:1, di atas putih 1.61:1 — nyaris tak terlihat.
 */
export function LogoWordmark({ className }: { className?: string }) {
  return (
    <Image
      src="/brand/logo-wordmark.png"
      alt={siteConfig.shortName}
      width={496}
      height={232}
      sizes="256px"
      className={cn("h-auto w-64", className)}
    />
  );
}
