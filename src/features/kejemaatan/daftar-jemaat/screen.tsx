"use client";

import { Plus } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/common/button";
import { DataList } from "@/components/common/data-list";
import { FilterChips } from "@/components/common/filter-chips";
import { SearchInput } from "@/components/common/search-input";
import { PageHeader } from "@/components/layout/page-header";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth/use-menu-access";
import { useJemaatList } from "@/features/kejemaatan/daftar-jemaat/api";
import { JEMAAT_LIST_PATH } from "@/features/kejemaatan/daftar-jemaat/model";
import { STATUS_JEMAAT_CHIPS } from "@/features/kejemaatan/daftar-jemaat/types";
import { JemaatListItemRow } from "@/features/kejemaatan/daftar-jemaat/ui/list-item";
import { useListParams } from "@/hooks/use-list-params";
import { cn } from "@/lib/utils";

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
  const { isCanCreate, isCanUpdate } = useMenuAccess(MENU.DAFTAR_JEMAAT);
  const listParams = useListParams();
  const jemaatList = useJemaatList(listParams);

  return (
    <div className="pb-6">
      <PageHeader
        title="Daftar Jemaat"
        subtitle={
          jemaatList.totalData === undefined
            ? undefined
            : `${jemaatList.totalData} jemaat`
        }
        backHref={domainHref(MENU.KEJEMAATAN)}
        action={
          // Tombol ini ada ATAU TIDAK ADA SAMA SEKALI di DOM — bukan tampil
          // dalam keadaan mati. Itu syarat verifikasi §13.4, dan sekaligus
          // satu-satunya bentuk yang jujur: tombol yang terlihat tapi menolak
          // ditekan membuat user mengira aplikasinya rusak, bukan mengira
          // dirinya tidak berhak.
          //
          // Gate-nya MENYALIN guard endpoint (`DAFTAR_JEMAAT` CREATE); ia
          // bukan pengaman. Pengamannya tetap `Authorization` di be-sada.
          isCanCreate ? (
            // `<Link>` bergaya tombol: lihat alasannya di `ui/list-item.tsx`.
            // Lingkaran, sama dengan tombol kembali di kiri header — kotak
            // 36px terlihat lebih besar daripada lingkaran 36px.
            <Link
              href={`${JEMAAT_LIST_PATH}/baru`}
              aria-label="Tambah jemaat"
              className={cn(
                buttonVariants({ size: "icon" }),
                "cursor-pointer rounded-full",
              )}
            >
              <Plus aria-hidden />
            </Link>
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
        items={jemaatList.items}
        getKey={(jemaat) => jemaat.code}
        label="Daftar jemaat"
        isLoading={jemaatList.isLoading}
        isRefreshing={jemaatList.isRefreshing}
        error={jemaatList.error}
        onRetry={jemaatList.onRetry}
        emptyTitle="Tidak ada jemaat"
        emptyDescription={
          listParams.search || listParams.status
            ? "Tidak ada jemaat yang cocok dengan pencarian atau filter ini."
            : "Data jemaat akan muncul di sini setelah ditambahkan."
        }
        pagination={jemaatList.pagination}
      >
        {(jemaat) => (
          <JemaatListItemRow jemaat={jemaat} isCanUpdate={isCanUpdate} />
        )}
      </DataList>
    </div>
  );
}
