"use client";

import { optionsOf } from "@/components/common/control";
import { DataList, ListToolbar } from "@/components/common/list";
import { PageHeader, PageHeaderAdd } from "@/components/layout";
import { MENU, createHref, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useListParams, type ListFilterSchema } from "@/hooks/use-list-params";

import { useRiwayatList } from "../api";
import { SACRAMENT_TYPE_LABEL } from "../types";

import { RiwayatListItemRow, riwayatTable } from "./list-item";

const LIST_FILTERS = { jenis: { api: "type" } } satisfies ListFilterSchema;

const TYPE_FILTER_OPTIONS = [
  { value: "", label: "Semua jenis" },
  ...optionsOf(SACRAMENT_TYPE_LABEL),
];

export const RiwayatListScreen = () => {
  const { isCanCreate, isCanUpdate } = useMenuAccess(MENU.RIWAYAT_JEMAAT);
  const listParams = useListParams({ filters: LIST_FILTERS });
  const riwayatList = useRiwayatList(listParams);

  return (
    <div className="pb-6">
      <PageHeader
        title="Riwayat Jemaat"
        subtitle={
          riwayatList.totalData === undefined
            ? undefined
            : `${riwayatList.totalData} riwayat`
        }
        backHref={domainHref(MENU.KEJEMAATAN)}
        action={
          isCanCreate ? (
            <PageHeaderAdd
              href={createHref(MENU.KEJEMAATAN, MENU.RIWAYAT_JEMAAT)}
              label="Catat riwayat"
            />
          ) : null
        }
      />

      <ListToolbar
        listParams={listParams}
        searchLabel="Cari riwayat"
        searchPlaceholder="Cari nama jemaat, no. surat, atau tempat"
        filters={[
          {
            key: "jenis",
            label: "Jenis",
            kind: "select",
            options: TYPE_FILTER_OPTIONS,
          },
        ]}
      />

      <DataList
        items={riwayatList.items}
        getKey={(riwayat) => riwayat.id}
        label="Daftar riwayat jemaat"
        isLoading={riwayatList.isLoading}
        isRefreshing={riwayatList.isRefreshing}
        error={riwayatList.error}
        onRetry={riwayatList.onRetry}
        emptyTitle="Tidak ada riwayat"
        emptyDescription={
          listParams.search || listParams.isFiltered
            ? "Tidak ada riwayat yang cocok dengan pencarian atau filter ini."
            : "Riwayat baptis, sidi, atestasi, dan meninggal akan muncul di sini setelah dicatat."
        }
        onClearFilter={
          listParams.isFiltered ? listParams.onClearFilters : undefined
        }
        pagination={riwayatList.pagination}
        table={riwayatTable(isCanUpdate)}
        itemNoun="riwayat"
      >
        {(riwayat) => (
          <RiwayatListItemRow riwayat={riwayat} isCanUpdate={isCanUpdate} />
        )}
      </DataList>
    </div>
  );
};
