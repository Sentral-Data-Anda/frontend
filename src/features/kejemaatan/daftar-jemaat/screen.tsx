"use client";

import { SearchInput } from "@/components/common/control/search-input";
import { SelectField } from "@/components/common/control/select-field";
import { DataList } from "@/components/common/list/data-list";
import { FilterChips } from "@/components/common/list/filter-chips";
import { ListToolbar } from "@/components/common/list/list-toolbar";
import { PageHeader, PageHeaderAdd } from "@/components/layout/page-header";
import { MENU, createHref, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth/use-menu-access";
import {
  useJemaatList,
  useZoneFilterOptions,
} from "@/features/kejemaatan/daftar-jemaat/api";
import { STATUS_JEMAAT_CHIPS } from "@/features/kejemaatan/daftar-jemaat/types";
import {
  JemaatListItemRow,
  jemaatTable,
} from "@/features/kejemaatan/daftar-jemaat/ui/list-item";
import { useListParams, type ListFilterSchema } from "@/hooks/use-list-params";

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
/** `?wilayah=<id>` di URL aplikasi → `zone` di be-sada (B15). */
const LIST_FILTERS = { wilayah: { api: "zone" } } satisfies ListFilterSchema;

export function JemaatListScreen() {
  const { isCanCreate, isCanUpdate } = useMenuAccess(MENU.DAFTAR_JEMAAT);
  const listParams = useListParams({ filters: LIST_FILTERS });
  const jemaatList = useJemaatList(listParams);
  const zoneOptions = useZoneFilterOptions();

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
            <PageHeaderAdd
              href={createHref(MENU.KEJEMAATAN, MENU.DAFTAR_JEMAAT)}
              label="Tambah jemaat"
            />
          ) : null
        }
      />

      <ListToolbar
        search={
          <SearchInput
            value={listParams.search}
            onSearch={listParams.onSearch}
            label="Cari jemaat"
            placeholder="Cari nama, kode, atau telepon"
          />
        }
        picker={
          <SelectField
            value={listParams.filters.wilayah ?? ""}
            onValueChange={(value) => listParams.onPickFilter("wilayah", value)}
            options={zoneOptions.options}
            placeholder="Semua wilayah"
            emptyMessage="Belum ada data wilayah"
            aria-label="Filter wilayah"
          />
        }
        filters={
          <FilterChips
            options={STATUS_JEMAAT_CHIPS}
            value={listParams.status}
            onPick={listParams.onPickStatus}
            label="Filter status jemaat"
          />
        }
      />

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
          listParams.search || listParams.status || listParams.filters.wilayah
            ? "Tidak ada jemaat yang cocok dengan pencarian atau filter ini."
            : "Data jemaat akan muncul di sini setelah ditambahkan."
        }
        pagination={jemaatList.pagination}
        table={jemaatTable(isCanUpdate)}
      >
        {(jemaat) => (
          <JemaatListItemRow jemaat={jemaat} isCanUpdate={isCanUpdate} />
        )}
      </DataList>
    </div>
  );
}
