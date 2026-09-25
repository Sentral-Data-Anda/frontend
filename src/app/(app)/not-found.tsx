import Link from "next/link";

import { buttonVariants } from "@/components/common/control";
import { PageContainer, PageHeader } from "@/components/layout";

export default function NotFound() {
  return (
    <PageContainer>
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
    </PageContainer>
  );
}
