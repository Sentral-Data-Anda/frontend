"use client";

import { Plus } from "lucide-react";

import { Button } from "@/components/common/button";
import { DataList } from "@/components/common/data-list";
import { FilterChips } from "@/components/common/filter-chips";
import { SearchInput } from "@/components/common/search-input";
import { PageHeader } from "@/components/layout/page-header";
import { MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth/use-menu-access";
import { useJemaatList } from "@/features/kejemaatan/daftar-jemaat/api";
import { JemaatListItemRow } from "@/features/kejemaatan/daftar-jemaat/list-item";
import { STATUS_JEMAAT_CHIPS } from "@/features/kejemaatan/daftar-jemaat/types";
import { useListParams } from "@/hooks/use-list-params";

/**
 * Layar cetakan: ini bentuk yang direplikasi ke puluhan layar daftar lain.
 *
 * Yang membuatnya tipis adalah pembagian kerja di bawah ini, dan pembagian itu
 * yang sebenarnya sedang dibakukan:
 *
 * - `useListParams` memegang filter dan halaman, dan menaruhnya di URL.
 * - `useJemaatList` memegang jaringan, cache, dan percobaan ulang.
 * - `DataList` memegang keempat keadaan (memuat, kosong, galat, isi).
 * - `JemaatListItemRow` memegang tampilan satu baris.
 *
 * Yang tersisa di berkas ini hanyalah merangkainya. Tidak ada `useEffect`,
 * tidak ada flag `isLoading` yang diset tangan, tidak ada `useState` untuk
 * data — dan itu bukan kebetulan, melainkan D10 yang sedang bekerja.
 */
export function JemaatListScreen() {
  const { isCanCreate } = useMenuAccess(MENU.DAFTAR_JEMAAT);
  const listParams = useListParams();
  const jemaatList = useJemaatList(listParams.query);

  const totalData = jemaatList.data?.totalData ?? 0;

  return (
    <div className="pb-6">
      <PageHeader
        title="Daftar Jemaat"
        subtitle={jemaatList.data ? `${totalData} jemaat` : undefined}
        backHref="/modul"
        action={
          // Tombol ini ada ATAU TIDAK ADA SAMA SEKALI di DOM — bukan tampil
          // dalam keadaan mati. Itu syarat verifikasi §13.4, dan sekaligus
          // satu-satunya bentuk yang jujur: tombol yang terlihat tapi menolak
          // ditekan membuat user mengira aplikasinya rusak, bukan mengira
          // dirinya tidak berhak.
          //
          // `disabled` di bawah bukan soal izin melainkan soal fase:
          // formulir tambah adalah Fase 3b dan rutenya belum ada, jadi
          // menautkannya sekarang berujung 404 di luar app shell.
          //
          // Varian isi (navy), bukan `outline`: outline pada opacity 50% di
          // atas kanvas terbaca sebagai kotak kosong yang rusak; navy pudar
          // terbaca sebagai tombol utama yang sedang nonaktif.
          isCanCreate ? (
            <Button
              type="button"
              size="icon"
              disabled
              aria-label="Tambah jemaat (belum tersedia)"
            >
              <Plus aria-hidden />
            </Button>
          ) : null
        }
      />

      <div className="space-y-3 px-gutter pb-4">
        <SearchInput
          value={listParams.search}
          onSearch={listParams.onSearch}
          label="Cari jemaat"
          placeholder="Cari nama, kode, atau telepon"
        />

        <FilterChips
          options={STATUS_JEMAAT_CHIPS}
          value={listParams.status}
          onPick={listParams.onPickStatus}
          label="Filter status jemaat"
        />
      </div>

      <DataList
        items={jemaatList.data?.data}
        getKey={(jemaat) => jemaat.code}
        label="Daftar jemaat"
        isLoading={jemaatList.isPending}
        isRefreshing={jemaatList.isFetching}
        error={jemaatList.error}
        onRetry={() => jemaatList.refetch()}
        emptyTitle="Tidak ada jemaat"
        emptyDescription={
          listParams.search || listParams.status
            ? "Tidak ada jemaat yang cocok dengan pencarian atau filter ini."
            : "Data jemaat akan muncul di sini setelah ditambahkan."
        }
        pagination={{
          page: listParams.page,
          totalPage: jemaatList.data?.totalPage ?? 0,
          onPickPage: listParams.onPickPage,
        }}
      >
        {(jemaat) => <JemaatListItemRow jemaat={jemaat} />}
      </DataList>
    </div>
  );
}
