import { Inbox } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Keadaan kosong, TANPA bingkai.
 *
 * Bentuk sebelumnya (`rounded-lg border border-dashed py-16`) adalah kotak
 * melayang di tengah halaman. Itu benar untuk kartu, tapi salah di sini:
 * tempat komponen ini muncul adalah di dalam bingkai daftar,
 * dan kotak bergaris putus-putus di sana terbaca sebagai potongan dari bahasa
 * desain yang lain — seolah ada komponen yang gagal dimuat. Daftar yang kosong
 * harus terlihat seperti daftar yang kosong, bukan seperti kesalahan. Di layar
 * daftar ia rata di kanvas, sama seperti barisnya.
 */
export function EmptyState({
  title = "Belum ada data",
  description,
  action,
  isCompact = false,
  className,
}: {
  title?: string;
  description?: string;
  /** Mis. tombol "Tambah" — hanya kalau perannya memang boleh menambah. */
  action?: React.ReactNode;
  /** Di dalam panel/widget: jarak dan ikon lebih kecil. */
  isCompact?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-16 text-center",
        isCompact && "px-2.5 pt-4 pb-2",
        className,
      )}
    >
      <Inbox
        className={cn(
          "text-muted-foreground mb-3 size-8",
          isCompact && "text-border mb-2 size-6",
        )}
        strokeWidth={isCompact ? 1.4 : 2}
        aria-hidden
      />

      <p
        className={cn(
          "text-body font-medium",
          isCompact && "text-muted-foreground max-w-60 font-normal",
        )}
      >
        {title}
      </p>

      {description ? (
        <p className="text-muted-foreground mt-1 max-w-xs text-body text-balance">
          {description}
        </p>
      ) : null}

      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
