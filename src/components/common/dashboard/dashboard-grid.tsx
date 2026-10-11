import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const SIDE_GRID =
  "grid min-w-0 gap-4 @min-[40rem]:grid-cols-2 @min-[40rem]:@max-[66rem]:[&>*:last-child:nth-child(odd)]:col-span-2";

const SIDE_STACKED =
  "@min-[66rem]:grid-cols-3 @min-[66rem]:@max-[104rem]:[&>*:last-child:nth-child(3n+1)]:col-span-3 @min-[66rem]:@max-[104rem]:[&>*:last-child:nth-child(3n+2)]:col-span-2 @min-[104rem]:grid-cols-[repeat(auto-fit,minmax(24rem,1fr))]";

// Dua ambang yang berbeda, dan keduanya mengukur container akar.
//
// Mulai SPLIT_MIN akar terbelah jadi kolom utama dan kolom sisi, masing-masing
// sekitar separuhnya. Di situ kolom sisi harus tetap satu kolom: membelahnya
// lagi menyisakan sekitar 230px per kartu, cukup untuk memotong judul kartu
// dan nama ruang jadi "Peminjaman Ruan…" dan "Aula Ser…".
//
// Baru di 82rem separuh akar cukup lebar untuk memuat dua kartu berdampingan,
// dan itu pun hanya mulai tiga kartu — sisi tampilan Umum tinggal 4 kartu sejak
// Ulang Tahun dan Jemaat Baru menyatu, dan sisi Keuangan tinggal 3 di
// production; satu kolom membuat keduanya menjulang melewati tinggi layar.
const SIDE_SPLIT =
  "@min-[60rem]:@max-[120rem]:grid-cols-1 @min-[60rem]:@max-[120rem]:[&>*:last-child:nth-child(odd)]:col-span-1 @min-[82rem]:@max-[120rem]:has-[>*:nth-child(3)]:grid-cols-2 @min-[82rem]:@max-[120rem]:has-[>*:nth-child(3)]:[&>*:last-child:nth-child(odd)]:col-span-2 @min-[120rem]:grid-cols-[repeat(auto-fit,minmax(24rem,1fr))]";

const MAIN_STACKED =
  "@min-[104rem]:has-[>*:nth-child(2)]:grid-cols-2 @min-[150rem]:has-[>*:nth-child(3)]:grid-cols-3 @min-[104rem]:[&>*]:mx-auto @min-[104rem]:[&>*]:w-full @min-[104rem]:[&>*]:max-w-[90rem]";

// Di jendela dua kolom, kolom utama jadi flex setinggi baris dan kartu terakhirnya
// menyerap sisa tinggi, sehingga kaki kedua kolom rata ketika kartu yang panjang
// (`isScrollable`) menyerap sisa tinggi kolom dan menggulir di dalam dirinya.
const MAIN_SPLIT =
  "@min-[60rem]:@max-[120rem]:flex @min-[60rem]:@max-[120rem]:h-full @min-[60rem]:@max-[120rem]:flex-col @min-[60rem]:@max-[120rem]:[&>*:last-child]:flex-1 @min-[120rem]:has-[>*:nth-child(2)]:grid-cols-2 @min-[150rem]:has-[>*:nth-child(3)]:grid-cols-3 @min-[120rem]:[&>*]:mx-auto @min-[120rem]:[&>*]:w-full @min-[120rem]:[&>*]:max-w-[90rem]";

interface PropTypes {
  kpi?: ReactNode;
  between?: ReactNode;
  main: ReactNode[];
  side: ReactNode[];
  isStacked?: boolean;
  /** Isi grid mengikuti tinggi induknya, bukan tinggi isinya. Induk harus punya
   *  tinggi pasti; dipakai Beranda supaya dashboard pas satu layar. */
  isFullHeight?: boolean;
}

export const DashboardGrid = (props: PropTypes) => {
  const {
    kpi,
    between,
    main,
    side,
    isStacked = false,
    isFullHeight = false,
  } = props;

  const isSplit = !isStacked && main.length > 0 && side.length > 0;

  return (
    <div
      className={cn(
        "@container",
        isFullHeight && "lg:flex lg:min-h-0 lg:flex-1 lg:flex-col",
      )}
    >
      <div
        className={cn(
          "flex flex-col gap-4",
          isFullHeight && "lg:min-h-0 lg:flex-1",
        )}
      >
        {kpi}
        {between}

        <div
          className={cn(
            "grid items-start gap-4",
            isFullHeight && "lg:min-h-0 lg:flex-1",
            // Di jendela dua kolom keduanya diregangkan setinggi baris supaya kaki
            // kolom rata: kolom yang isinya lebih pendek membagi sisa tinggi ke
            // kartunya, bukan menyisakan lubang di bawah.
            isSplit &&
              "@min-[60rem]:@max-[120rem]:grid-cols-2 @min-[60rem]:@max-[120rem]:items-stretch",
            // `grid-rows-1` (`minmax(0,1fr)`) memberi barisnya tinggi dari induknya,
            // bukan dari isinya, sehingga kartu `isScrollable` menyusut dan menggulir
            // alih-alih memanjangkan halaman.
            isFullHeight && isSplit && "@min-[60rem]:@max-[120rem]:grid-rows-1",
          )}
        >
          {main.length ? (
            <div
              className={cn(
                "grid min-w-0 gap-4",
                isStacked ? MAIN_STACKED : MAIN_SPLIT,
              )}
            >
              {main}
            </div>
          ) : null}
          {side.length ? (
            <div
              className={cn(SIDE_GRID, isStacked ? SIDE_STACKED : SIDE_SPLIT)}
            >
              {side}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
