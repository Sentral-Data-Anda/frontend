import Link from "next/link";

import { buttonVariants } from "@/components/common/button";
import { Container } from "@/components/layout/container";

export default function NotFound() {
  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <p className="text-5xl font-bold text-primary">404</p>
      <h1 className="text-2xl font-semibold">Halaman tidak ditemukan</h1>
      <p className="max-w-md text-muted-foreground">
        Halaman yang Anda cari tidak tersedia atau telah dipindahkan.
      </p>
      <Link href="/" className={buttonVariants()}>
        Kembali ke beranda
      </Link>
    </Container>
  );
}
