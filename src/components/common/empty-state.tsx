import { Inbox } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Keadaan kosong, TANPA bingkai.
 *
 * Bentuk sebelumnya (`rounded-lg border border-dashed py-16`) adalah kotak
 * melayang di tengah halaman. Itu benar untuk kartu, tapi salah di sini:
 * tempat komponen ini muncul adalah di dalam daftar full-bleed ber-`divide-y`,
 * dan kotak bergaris putus-putus di sana terbaca sebagai potongan dari bahasa
 * desain yang lain — seolah ada komponen yang gagal dimuat. Daftar yang kosong
 * harus terlihat seperti daftar yang kosong, bukan seperti kesalahan.
 */
export function EmptyState({
  title = "Belum ada data",
  description,
  action,
  className,
}: {
  title?: string;
  description?: string;
  /** Mis. tombol "Tambah" — hanya kalau perannya memang boleh menambah. */
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-16 text-center",
        className,
      )}
    >
      <Inbox className="text-muted-foreground mb-3 size-8" aria-hidden />

      <p className="text-body font-medium">{title}</p>

      {description ? (
        <p className="text-muted-foreground mt-1 max-w-xs text-body text-balance">
          {description}
        </p>
      ) : null}

      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
