import type { ReactNode } from "react";

/**
 * Baris alat di atas daftar: pencarian, pilihan (mis. wilayah), lalu chip.
 *
 * Container query, jadi layar tidak menulis breakpoint:
 * - isi < 36rem (HP): cari + pilihan sebaris, chip di bawahnya. Chip tetap
 *   satu baris geser selebar layar, tidak berbagi baris.
 * - isi ≥ 36rem (tablet, desktop): semuanya satu baris. Kotak cari paling
 *   lebar 20rem — cukup untuk "Cari nama, kode, atau telepon" tanpa
 *   terpotong, dan tidak melar sampai chip terdorong ke ujung kanan tabel.
 *
 * Tanpa `picker`, susunannya sama: cari lalu chip.
 *
 * Di baris lebar chip tidak lagi menjorok ke gutter (`FilterChips` memakai
 * `-mx-gutter` untuk area geser selebar layar di HP): kalau tetap menjorok,
 * area gesernya menutupi 8px tepi kanan kontrol di sebelahnya dan klik di
 * sana jatuh ke chip.
 */
export function ListToolbar({
  search,
  picker,
  filters,
}: {
  search: ReactNode;
  /** Satu kontrol pilihan di samping kotak cari. */
  picker?: ReactNode;
  filters?: ReactNode;
}) {
  if (!picker) {
    return (
      <div className="@container px-gutter pb-4">
        <div className="flex flex-col gap-3 @min-[36rem]:flex-row @min-[36rem]:items-center @min-[36rem]:[&>[role=group]]:mx-0 @min-[36rem]:[&>[role=group]]:px-0">
          <div className="@min-[36rem]:w-80 @min-[36rem]:shrink-0">
            {search}
          </div>

          {filters}
        </div>
      </div>
    );
  }

  return (
    <div className="@container px-gutter pb-4">
      <div className="flex flex-col gap-3 @min-[36rem]:flex-row @min-[36rem]:items-center @min-[36rem]:[&>[role=group]]:mx-0 @min-[36rem]:[&>[role=group]]:px-0">
        {/*
          Cari + pilihan sebagai satu kelompok. Di baris lebar kelompok ini
          mengisi sisa ruang di samping chip tapi berhenti di 30.5rem (cari
          20rem + pilihan 10rem), jadi di tablet cari menyempit dulu, di
          desktop tidak melar.
        */}
        <div className="flex gap-2 @min-[36rem]:max-w-[30.5rem] @min-[36rem]:flex-1">
          <div className="min-w-0 flex-1">{search}</div>

          <div className="w-32 shrink-0 @min-[36rem]:w-40">{picker}</div>
        </div>

        {filters}
      </div>
    </div>
  );
}
