import Link from "next/link";

import { buttonVariants } from "@/components/common/button";
import { shellWidth } from "@/components/layout/shell-width";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <div
      className={cn(
        shellWidth,
        "flex min-h-[60vh] flex-col items-center justify-center gap-4 px-gutter text-center",
      )}
    >
      <p className="text-5xl font-semibold text-primary">404</p>
      <h1 className="text-2xl font-semibold">Halaman tidak ditemukan</h1>
      <p className="max-w-md text-muted-foreground">
        Halaman yang Anda cari tidak tersedia atau telah dipindahkan.
      </p>
      <Link href="/" className={buttonVariants()}>
        Kembali ke beranda
      </Link>
    </div>
  );
}
