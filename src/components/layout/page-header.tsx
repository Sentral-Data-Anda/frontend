import { ArrowLeft } from "lucide-react";
import Link from "next/link";

/**
 * Header satu layar: tombol kembali, judul, satu aksi di kanan.
 *
 * `backHref` berupa tautan, bukan `router.back()`. Layar ini bisa dibuka
 * langsung dari notifikasi push atau dari tautan yang dibagikan, dan pada
 * kasus itu `back()` melempar user keluar dari aplikasi.
 */
export function PageHeader({
  title,
  subtitle,
  backHref,
  action,
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="flex items-center gap-3 px-gutter pt-[max(1rem,env(safe-area-inset-top))] pb-3">
      {backHref ? (
        <Link
          href={backHref}
          aria-label="Kembali"
          // Tampil 30px; `after:` memperluas area sentuh tak terlihat ke 42px
          // tanpa membesarkan layout.
          className="border-border relative flex size-control shrink-0 items-center justify-center rounded-full border after:absolute after:-inset-1.5"
        >
          <ArrowLeft className="size-4" aria-hidden />
        </Link>
      ) : null}

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-title font-semibold">{title}</h1>
        {subtitle ? (
          <p className="text-muted-foreground truncate text-caption">
            {subtitle}
          </p>
        ) : null}
      </div>

      {action}
    </header>
  );
}
