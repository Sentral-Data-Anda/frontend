import type { ReactNode } from "react";

/**
 * Baris alat di atas daftar: pencarian, pilihan (mis. wilayah), lalu chip.
 *
 * Container query, jadi layar tidak menulis breakpoint:
 * - isi < 36rem (HP): cari selebar kolom — PERSIS seperti sebelum ada
 *   pilihan (keputusan user: HP sudah disukai) — lalu baris chip yang
 *   diawali pilihan. Kalau chip bertambah, baris itu digulir mendatar.
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
      {/*
        Grid, supaya `picker` dirender SEKALI tapi duduk di tempat berbeda:
        - HP: cari selebar kolom (2 jalur), lalu baris chip = pilihan 8rem +
          chip. Tinggi pilihan disamakan dengan chip (28px, bulat), jadi
          baris chip tidak bertambah tinggi. Chip hanya menjorok ke kanan
          (area geser sampai tepi layar), tidak ke kiri menutupi pilihan.
        - ≥ 36rem: satu baris — cari paling lebar 20rem (menyempit dulu di
          tablet), pilihan 10rem, chip.
      */}
      <div className="grid grid-cols-[8rem_minmax(0,1fr)] items-center gap-x-2 gap-y-3 [&>[role=group]]:ml-0 [&>[role=group]]:pl-0 @min-[36rem]:grid-cols-[minmax(0,20rem)_10rem_auto] @min-[36rem]:[&>[role=group]]:ml-1 @min-[36rem]:[&>[role=group]]:mr-0 @min-[36rem]:[&>[role=group]]:pr-0">
        <div className="col-span-2 @min-[36rem]:col-span-1">{search}</div>

        <div className="[&>button]:h-7 [&>button]:rounded-full @min-[36rem]:[&>button]:h-control @min-[36rem]:[&>button]:rounded-control">
          {picker}
        </div>

        {filters}
      </div>
    </div>
  );
}
