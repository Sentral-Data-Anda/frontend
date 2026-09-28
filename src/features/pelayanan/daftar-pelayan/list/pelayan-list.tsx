"use client";

import { DataList, ListToolbar } from "@/components/common/list";
import { PageHeader, PageHeaderAdd } from "@/components/layout";
import { MENU, createHref, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useListParams, type ListFilterSchema } from "@/hooks/use-list-params";

import { useDaftarPelayanList, useFilterOptions } from "../api";
import { PELAYAN_STATUS_OPTIONS } from "../types";

import { PelayanListItemRow, daftarPelayanTable } from "./list-item";

const LIST_FILTERS = {
  bapel: { api: "bapelId" },
  tugas: { api: "roleId" },
} satisfies ListFilterSchema;

export const PelayanList = () => {
  const { isCanCreate, isCanUpdate } = useMenuAccess(MENU.DAFTAR_PELAYAN);
  const listParams = useListParams({ filters: LIST_FILTERS });
  const pelayanList = useDaftarPelayanList(listParams);
  const bapelOptions = useFilterOptions("bapel", "Semua badan pelayanan");
  const tugasOptions = useFilterOptions("role-pelayan", "Semua tugas");
  const isNarrowed = Boolean(listParams.search) || listParams.isFiltered;

  return (
    <div className="pb-6">
      <PageHeader
        title="Daftar Pelayan"
        subtitle={
          pelayanList.totalData === undefined
            ? undefined
            : `${pelayanList.totalData} pelayan`
        }
        backHref={domainHref(MENU.PELAYANAN)}
        action={
          isCanCreate ? (
            <PageHeaderAdd
              href={createHref(MENU.PELAYANAN, MENU.DAFTAR_PELAYAN)}
              label="Tambah pelayan"
            />
          ) : null
        }
      />

      <ListToolbar
        listParams={listParams}
        searchLabel="Cari pelayan"
        searchPlaceholder="Cari nama, kode, atau badan pelayanan"
        filters={[
          {
            key: "bapel",
            label: "Badan pelayanan",
            kind: "select",
            options: bapelOptions.options,
            emptyMessage: "Belum ada data badan pelayanan",
          },
          {
            key: "tugas",
            label: "Tugas",
            kind: "select",
            options: tugasOptions.options,
            emptyMessage: "Belum ada data tugas",
          },
          {
            key: "status",
            label: "Status",
            kind: "choice",
            options: PELAYAN_STATUS_OPTIONS,
          },
        ]}
      />

      <DataList
        items={pelayanList.items}
        getKey={(pelayan) => pelayan.code}
        label="Daftar pelayan"
        isLoading={pelayanList.isLoading}
        isRefreshing={pelayanList.isRefreshing}
        error={pelayanList.error}
        onRetry={pelayanList.onRetry}
        emptyTitle={isNarrowed ? "Tidak ada pelayan" : "Belum ada pelayan"}
        emptyDescription={
          isNarrowed
            ? "Tidak ada pelayan yang cocok dengan pencarian atau filter ini."
            : "Daftarkan jemaat atau kelompok yang melayani di ibadah, mis. liturgis, pemusik, paduan suara."
        }
        onClearFilter={
          listParams.isFiltered ? listParams.onClearFilters : undefined
        }
        pagination={pelayanList.pagination}
        table={daftarPelayanTable(isCanUpdate)}
        itemNoun="pelayan"
      >
        {(pelayan) => (
          <PelayanListItemRow pelayan={pelayan} isCanUpdate={isCanUpdate} />
        )}
      </DataList>
    </div>
  );
};
