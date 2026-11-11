import { buttonVariants } from "@/components/common/control";
import { AppLink } from "@/components/common/link";
import { PageContainer, PageHeader } from "@/components/layout";

export const AppNotFound = () => (
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

      <AppLink href="/modul" className={buttonVariants({ variant: "outline" })}>
        Lihat semua modul
      </AppLink>
    </div>
  </PageContainer>
);
