"use client";

import { DataList, ListToolbar } from "@/components/common/list";
import { PageHeader, PageHeaderAdd } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useDdlOptions } from "@/hooks/use-ddl-options";
import { useListParams, type ListFilterSchema } from "@/hooks/use-list-params";

import { useGaleriList } from "../api";
import { GALERI_CREATE_PATH } from "../model";

import { GaleriListItemRow, galeriTable } from "./list-item";

const LIST_FILTERS = {
  bapel: { api: "bapelId" },
} satisfies ListFilterSchema;

export const GaleriListContent = () => {
  const { isCanCreate, isCanUpdate } = useMenuAccess(MENU.GALERI);
  const listParams = useListParams({ filters: LIST_FILTERS });
  const galeriList = useGaleriList(listParams);
  const bapel = useDdlOptions("bapel", "id", listParams.filters.bapel);
  const isNarrowed = Boolean(listParams.search) || listParams.isFiltered;

  return (
    <div className="pb-6">
      <PageHeader
        title="Galeri"
        subtitle={
          galeriList.totalData === undefined
            ? undefined
            : `${galeriList.totalData} album`
        }
        backHref={domainHref(MENU.KEGIATAN)}
        action={
          isCanCreate ? (
            <PageHeaderAdd href={GALERI_CREATE_PATH} label="Tambah album" />
          ) : null
        }
      />

      <ListToolbar
        listParams={listParams}
        searchLabel="Cari album"
        searchPlaceholder="Cari nama album"
        filters={[
          {
            key: "bapel",
            label: "Badan pelayanan",
            kind: "select",
            options: [
              { value: "", label: "Semua badan pelayanan" },
              ...bapel.options,
            ],
          },
        ]}
      />

      <DataList
        items={galeriList.items}
        getKey={(album) => album.code}
        label="Daftar album"
        isLoading={galeriList.isLoading}
        isRefreshing={galeriList.isRefreshing}
        error={galeriList.error}
        onRetry={galeriList.onRetry}
        emptyTitle={isNarrowed ? "Tidak ada album" : "Belum ada album"}
        emptyDescription={
          isNarrowed
            ? "Tidak ada album yang cocok dengan pencarian atau filter ini."
            : "Buat album untuk menyimpan foto kegiatan gereja."
        }
        onClearFilter={
          listParams.isFiltered ? listParams.onClearFilters : undefined
        }
        pagination={galeriList.pagination}
        table={galeriTable(isCanUpdate)}
        itemNoun="album"
      >
        {(album) => (
          <GaleriListItemRow album={album} isCanUpdate={isCanUpdate} />
        )}
      </DataList>
    </div>
  );
};
