"use client";

import { ChevronLeft, ChevronRight, TriangleAlert } from "lucide-react";
import { Fragment, type ReactNode } from "react";

import { EmptyState } from "@/components/common/empty-state";
import { LoadingList } from "@/components/common/loading-list";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Satu baris daftar, tinggi tetap 56px.
 *
 * TIGA SLOT, bukan `children` bebas. Idiom ini sudah de facto di repo
 * (`module-grid.tsx:131`, `home-screen.tsx:77`) dan bentuknya selalu sama:
 * sesuatu di kiri, dua baris teks di tengah, sesuatu di kanan. Membiarkan
 * layar menyusun isinya sendiri berarti 61 layar masing-masing memutuskan
 * ukuran huruf dan jarak baris kedua — persis yang dilarang D14.
 *
 * Yang membuat baris ini tahan di 390px adalah `min-w-0` pada kolom tengah.
 * Tanpa itu, `truncate` tidak pernah menyala: flex item punya `min-width:auto`
 * secara bawaan, jadi kolomnya melebar mengikuti teks dan justru mendorong
 * badge di kanan keluar layar alih-alih memotong namanya.
 *
 * `trailing` dan `leading` sengaja `ReactNode`, bukan `badge: string`: kolom
 * kanan berisi badge status di satu layar, nominal rupiah di layar keuangan,
 * dan tanggal di layar jadwal. Menyempitkannya ke satu jenis nilai hanya akan
 * melahirkan `DataListRowWithAmount` di layar ketujuh.
 */
export function DataListRow({
  title,
  meta,
  leading,
  trailing,
  className,
}: {
  title: ReactNode;
  /** Baris kedua: kode, kategori, apa pun yang membedakan dua nama yang sama. */
  meta?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  className?: string;
}) {
  return (
    <li className={cn("flex h-14 items-center gap-3 px-gutter", className)}>
      {leading}

      <div className="min-w-0 flex-1">
        <p className="truncate text-body font-medium">{title}</p>

        {meta ? (
          <p className="text-muted-foreground truncate text-caption tabular-nums">
            {meta}
          </p>
        ) : null}
      </div>

      {trailing ? (
        <div className="flex shrink-0 items-center gap-2">{trailing}</div>
      ) : null}
    </li>
  );
}

export type DataListPagination = {
  page: number;
  totalPage: number;
  onPickPage: (page: number) => void;
};

/**
 * Daftar berpaginasi beserta SELURUH keadaannya: memuat, kosong, galat, isi.
 *
 * Empat keadaan itu adalah alasan komponen ini ada. Ditulis di layar, tiap
 * layar memilih sendiri mana yang diurus — dan yang paling sering terlupa
 * adalah galat, karena ia tidak pernah muncul saat menyusun layarnya.
 *
 * `isLoading` vs `isRefreshing` adalah pembedaan yang menentukan rasa layar
 * ini. Skeleton hanya tampil saat BELUM ADA APA-APA. Pindah halaman atau
 * mengetik di kotak cari menyalakan `isRefreshing`: daftar lama tetap di
 * tempatnya dan hanya diredupkan. Tanpa pembedaan ini, setiap huruf yang
 * diketik meruntuhkan daftar jadi skeleton lalu membangunnya lagi, dan
 * layarnya berkedip.
 *
 * DAFTAR KOSONG BUKAN GALAT. be-sada menjawab 404 saat filter tidak menemukan
 * apa pun; `fetchList` sudah menerjemahkannya jadi array kosong, jadi yang
 * sampai ke sini adalah `items.length === 0` dan yang tampil adalah
 * `EmptyState` — bukan blok merah di bawah.
 */
export function DataList<T>({
  items,
  getKey,
  children,
  label,
  isLoading = false,
  isRefreshing = false,
  error,
  onRetry,
  emptyTitle,
  emptyDescription,
  emptyAction,
  pagination,
  inset = false,
}: {
  items: T[] | undefined;
  /** Kunci stabil dari data. Indeks array dilarang (§7 aturan 5). */
  getKey: (item: T) => string;
  children: (item: T) => ReactNode;
  /** Nama daftar untuk pembaca layar, mis. "Daftar jemaat". */
  label: string;
  isLoading?: boolean;
  isRefreshing?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  pagination?: DataListPagination;
  /**
   * Garis pemisah mulai dari tepi kiri judul (setelah `leading` 40px + gap
   * 12px) sampai gutter kanan, baris langsung di atas kanvas. Bawaan: baris
   * putih (`bg-card`) dengan garis full-bleed, untuk layar daftar.
   */
  inset?: boolean;
}) {
  if (error) {
    return (
      <div
        role="alert"
        className="flex flex-col items-center justify-center px-6 py-16 text-center"
      >
        <TriangleAlert className="text-destructive mb-3 size-8" aria-hidden />

        <p className="text-body font-medium">Gagal memuat data</p>

        <p className="text-muted-foreground mt-1 max-w-xs text-body text-balance">
          {error.message}
        </p>

        {onRetry ? (
          <Button
            type="button"
            variant="outline"
            onClick={onRetry}
            className="mt-4"
          >
            Coba lagi
          </Button>
        ) : null}
      </div>
    );
  }

  if (isLoading || !items)
    return <LoadingList className={inset ? undefined : "bg-card"} />;

  if (items.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }

  return (
    <div aria-busy={isRefreshing || undefined}>
      <ul
        aria-label={label}
        className={cn(
          "transition-opacity",
          inset
            ? "[&>li]:relative [&>li+li]:before:absolute [&>li+li]:before:top-0 [&>li+li]:before:right-gutter [&>li+li]:before:left-[calc(var(--spacing-gutter)+3.25rem)] [&>li+li]:before:border-t [&>li+li]:before:border-border"
            : "divide-border bg-card divide-y",
          isRefreshing && "opacity-60",
        )}
      >
        {items.map((item) => (
          // `Fragment` berkunci, bukan `<div key>`: kunci harus ada di
          // elemen terluar yang dikembalikan `.map()`, sementara
          // `children(item)` sudah membawa `<li>`-nya sendiri. Elemen nyata
          // apa pun yang diselipkan antara `<ul>` dan `<li>` mematikan
          // `divide-y` dan merusak struktur daftar bagi pembaca layar.
          <Fragment key={getKey(item)}>{children(item)}</Fragment>
        ))}
      </ul>

      {pagination && pagination.totalPage > 1 ? (
        <DataListPager {...pagination} />
      ) : null}
    </div>
  );
}

/**
 * Paginasi "sebelumnya / halaman x dari y / berikutnya".
 *
 * Bukan deretan nomor halaman: pada 390px sepuluh nomor tidak muat, dan
 * memotongnya jadi "1 … 4 5 6 … 12" adalah logika yang harus dijaga untuk
 * imbalan yang tidak diminta siapa pun. Lompat ke halaman tertentu ditambahkan
 * kalau ternyata benar-benar dicari — sampai itu terbukti, dua tombol sudah
 * mengerjakan seluruh tugasnya.
 */
function DataListPager({ page, totalPage, onPickPage }: DataListPagination) {
  return (
    <nav
      aria-label="Paginasi"
      className="border-border flex items-center justify-between gap-3 border-t px-gutter py-3"
    >
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPickPage(page - 1)}
      >
        <ChevronLeft aria-hidden />
        Sebelumnya
      </Button>

      {/* aria-live: pengguna pembaca layar yang menekan "Berikutnya" tidak
          melihat daftar berubah, jadi perubahan nomor halamanlah yang
          mengabarkannya. */}
      <p
        aria-live="polite"
        className="text-muted-foreground text-caption tabular-nums"
      >
        Halaman {page} dari {totalPage}
      </p>

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={page >= totalPage}
        onClick={() => onPickPage(page + 1)}
      >
        Berikutnya
        <ChevronRight aria-hidden />
      </Button>
    </nav>
  );
}
