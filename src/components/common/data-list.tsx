"use client";

import { TriangleAlert } from "lucide-react";
import { Fragment, type ReactNode } from "react";

import {
  DataListMore,
  DataListPager,
  type DataListPagination,
} from "@/components/common/data-list-pagination";
import { EmptyState } from "@/components/common/empty-state";
import {
  LIST_DIVIDER,
  LoadingList,
  LoadingRows,
} from "@/components/common/loading-list";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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

      {/* `data-slot="row-body"`: garis pemisah `DataList` digambar di sini,
          bukan di `<li>`, supaya garisnya mulai tepat di tepi kiri judul
          berapa pun lebar `leading` (avatar 36px, kotak jam 40px, kosong). */}
      <div
        data-slot="row-body"
        className="flex min-w-0 flex-1 items-center gap-3 self-stretch border-border"
      >
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
      </div>
    </li>
  );
}

/**
 * Bingkai daftar. Bawaan: satu kartu putih bersudut 12px di atas kanvas,
 * bergutter kiri-kanan — bentuk yang sama dengan kartu kas Beranda.
 * `[&_li]:px-3.5` mengganti `px-gutter` baris dengan padding kartu 14px;
 * selektor induk menang atas kelas baris karena spesifisitasnya lebih tinggi.
 *
 * `inset`: tanpa kartu, baris langsung di atas kanvas (Beranda "Hari ini").
 *
 * Diekspor untuk fallback `Suspense` layar daftar, supaya skeleton sebelum
 * layar termuat sudah berbentuk kartu yang sama.
 */
export function DataListFrame({
  inset = false,
  children,
}: {
  inset?: boolean;
  children: ReactNode;
}) {
  if (inset) return <>{children}</>;

  return (
    <div className="px-gutter">
      <Card className="gap-0 rounded-lg py-0 shadow-sm [&_li]:px-3.5">
        {children}
      </Card>
    </div>
  );
}

/**
 * Daftar berpaginasi beserta SELURUH keadaannya: memuat, kosong, galat, isi.
 *
 * Empat keadaan itu adalah alasan komponen ini ada. Ditulis di layar, tiap
 * layar memilih sendiri mana yang diurus — dan yang paling sering terlupa
 * adalah galat, karena ia tidak pernah muncul saat menyusun layarnya. Keempatnya
 * tampil di dalam bingkai yang sama (`DataListFrame`), jadi kartu tidak
 * melompat bentuk saat data tiba atau gagal.
 *
 * `isLoading` vs `isRefreshing` adalah pembedaan yang menentukan rasa layar
 * ini. Skeleton hanya tampil saat BELUM ADA APA-APA. Pindah halaman atau
 * mengetik di kotak cari menyalakan `isRefreshing`: daftar lama tetap di
 * tempatnya dan hanya diredupkan. Tanpa pembedaan ini, setiap huruf yang
 * diketik meruntuhkan daftar jadi skeleton lalu membangunnya lagi, dan
 * layarnya berkedip.
 *
 * `pagination` datang utuh dari `useListQuery` dan bentuknya sudah memutuskan
 * mode: `"pages"` → pager bernomor di bawah kartu (desktop), `"more"` → daftar
 * bertumpuk dengan skeleton dan tombol "Muat lebih banyak" di ujung kartu
 * (mobile/tablet). Layar tidak tahu mode mana yang aktif.
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
  /** Lihat `DataListFrame`. Bawaan: kartu (layar daftar). */
  inset?: boolean;
}) {
  if (error) {
    return (
      <DataListFrame inset={inset}>
        <div
          role="alert"
          className="flex flex-col items-center justify-center px-6 py-12 text-center"
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
      </DataListFrame>
    );
  }

  if (isLoading || !items) {
    return (
      <DataListFrame inset={inset}>
        <LoadingList />
      </DataListFrame>
    );
  }

  if (items.length === 0) {
    return (
      <DataListFrame inset={inset}>
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          action={emptyAction}
          className="py-12"
        />
      </DataListFrame>
    );
  }

  return (
    <div aria-busy={isRefreshing || undefined}>
      <DataListFrame inset={inset}>
        <ul
          aria-label={label}
          className={cn(
            LIST_DIVIDER,
            "transition-opacity",
            isRefreshing && "opacity-60",
          )}
        >
          {items.map((item) => (
            // `Fragment` berkunci, bukan `<div key>`: kunci harus ada di
            // elemen terluar yang dikembalikan `.map()`, sementara
            // `children(item)` sudah membawa `<li>`-nya sendiri. Elemen nyata
            // apa pun yang diselipkan antara `<ul>` dan `<li>` mematikan
            // garis pemisah dan merusak struktur daftar bagi pembaca layar.
            <Fragment key={getKey(item)}>{children(item)}</Fragment>
          ))}

          {pagination?.mode === "more" && pagination.isLoadingMore ? (
            <LoadingRows rows={3} />
          ) : null}
        </ul>

        {pagination?.mode === "more" ? (
          <DataListMore {...pagination} shown={items.length} />
        ) : null}
      </DataListFrame>

      {pagination?.mode === "pages" && pagination.totalPage > 1 ? (
        <DataListPager {...pagination} />
      ) : null}
    </div>
  );
}
