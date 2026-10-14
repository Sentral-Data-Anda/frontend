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

// Di jendela dua kolom tinggi kolom sudah dikunci setinggi baris. Tanpa ini
// isinya cuma meluber keluar kotak dan memanjangkan halaman, sehingga yang
// menggulir justru seluruh layar beserta sidebar-nya. `min-h-0` membuat kolom
// boleh lebih pendek daripada isinya, dan `overscroll-contain` menahan gulirnya
// supaya tidak merembet ke halaman ketika sudah mentok.
const COLUMN_SCROLL =
  "relative @min-[60rem]:@max-[120rem]:min-h-0 @min-[60rem]:@max-[120rem]:overflow-y-auto @min-[60rem]:@max-[120rem]:overscroll-contain";

// Di bawah 60rem kolomnya tidak terbelah, jadi COLUMN_SCROLL tidak berlaku --
// padahal tingginya SUDAH dikunci sejak `lg:` (viewport 1024px). Selisih dua
// ambang itu nyata: antara viewport 1024 dan sekitar 1280, isi kartu meluber
// keluar kotak yang tingginya terkunci dan yang menggulir justru seluruh
// dokumen, membawa serta sidebar-nya.
//
// Keduanya tidak bisa disamakan: `lg:` mengukur viewport sedangkan 60rem
// mengukur container, dan sidebar yang dilipat mengubah lebar container pada
// viewport yang sama. Jadi yang ditutup adalah selisihnya, di sini, dengan
// seluruh isi dashboard menggulir sebagai satu blok.
//
// 59.9375rem, bukan 60rem: `@max-` bersifat inklusif, dan tepat di 60rem
// keduanya akan menyala sekaligus.
//
// `relative` pada kedua kotak gulir, dan itu bukan hiasan: `sr-only` memakai
// `position: absolute`, dan sebuah elemen absolut mencari leluhur TERPOSISI
// sebagai blok penampungnya. Tanpa `relative` penampungnya adalah `html`
// sendiri, sehingga label pembaca layar di dalam kartu LOLOS dari kotak gulir
// mana pun dan ikut menentukan tinggi dokumen -- halamannya menggulir persis
// sampai label terakhir, dan `overflow: hidden` di leluhur mana pun tidak
// menahannya karena bukan leluhur itu yang menjadi penampungnya.
const STACKED_SCROLL =
  "relative @max-[59.9375rem]:min-h-0 @max-[59.9375rem]:overflow-y-auto @max-[59.9375rem]:overscroll-contain";

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
            isFullHeight && STACKED_SCROLL,
          )}
        >
          {main.length ? (
            <div
              className={cn(
                "grid min-w-0 gap-4",
                isStacked ? MAIN_STACKED : MAIN_SPLIT,
                // Kartu `isScrollable` menyerap sisa tinggi, tapi penyerapannya
                // berhenti di `min-h-64`. Di layar pendek sisa tingginya kurang
                // dari itu dan kolomnya tetap meluber, jadi kolom ini pun
                // menggulir sendiri sebagai batas terakhir.
                isFullHeight && isSplit && COLUMN_SCROLL,
              )}
            >
              {main}
            </div>
          ) : null}
          {side.length ? (
            <div
              className={cn(
                SIDE_GRID,
                isStacked ? SIDE_STACKED : SIDE_SPLIT,
                // Kolom utama menyerap sisa tinggi lewat kartu `isScrollable`
                // terakhirnya; kolom sisi tidak punya padanannya karena
                // kartunya pendek-pendek dan tidak ada satu pun yang pantas
                // ditunjuk sebagai penyerap. Jadi kolomnya sendiri yang
                // menggulir: tingginya terkunci setinggi baris dan isinya yang
                // bergerak, bukan halamannya.
                isFullHeight && isSplit && COLUMN_SCROLL,
              )}
            >
              {side}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
