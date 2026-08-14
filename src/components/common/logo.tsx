import Image from "next/image";
import Link from "next/link";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

/**
 * Lencana logo SADA.
 *
 * Memakai berkas ikon yang sama dengan manifest (`/icons/icon-192.png`) supaya
 * lencana di dalam aplikasi dan ikon di home screen tidak pernah berbeda —
 * satu berkas, satu tempat menggantinya.
 *
 * `sizes` diisi karena lencana ini dirender jauh lebih kecil dari sumbernya;
 * tanpa itu browser bisa mengunduh varian yang lebih besar dari perlu.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn("flex items-center gap-2 font-semibold", className)}
    >
      <Image
        src="/icons/icon-192.png"
        alt=""
        width={32}
        height={32}
        sizes="32px"
        className="size-8 rounded-md"
        priority
      />
      <span className="text-base">{siteConfig.shortName}</span>
    </Link>
  );
}
