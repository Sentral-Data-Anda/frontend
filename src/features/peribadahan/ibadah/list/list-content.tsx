"use client";

import { DataList, ListToolbar } from "@/components/common/list";
import { PageHeader, PageHeaderAdd } from "@/components/layout";
import { MENU, createHref, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useDdlOptions } from "@/hooks/use-ddl-options";
import { useListParams, type ListFilterSchema } from "@/hooks/use-list-params";

import { useIbadahList } from "../api";
import { monthOptions } from "../model";

import { IbadahListItemRow, ibadahTable } from "./list-item";

const LIST_FILTERS = {
  tipe: { api: "typeIbadahId" },
  bulan: { api: "bulan" },
} satisfies ListFilterSchema;

const MONTH_OPTIONS = [{ value: "", label: "Semua bulan" }, ...monthOptions()];

export const IbadahListContent = () => {
  const { isCanCreate, isCanUpdate } = useMenuAccess(MENU.IBADAH);
  const listParams = useListParams({ filters: LIST_FILTERS });
  const ibadahList = useIbadahList(listParams);
  const types = useDdlOptions("type-ibadah", "id", listParams.filters.tipe);

  return (
    <div className="pb-6">
      <PageHeader
        title="Ibadah"
        subtitle={
          ibadahList.totalData === undefined
            ? undefined
            : `${ibadahList.totalData} ibadah`
        }
        backHref={domainHref(MENU.PERIBADAHAN)}
        action={
          isCanCreate ? (
            <PageHeaderAdd
              href={createHref(MENU.PERIBADAHAN, MENU.IBADAH)}
              label="Tambah ibadah"
            />
          ) : null
        }
      />

      <ListToolbar
        listParams={listParams}
        searchLabel="Cari ibadah"
        searchPlaceholder="Cari tipe, tema, pengkhotbah, atau kode"
        filters={[
          {
            key: "tipe",
            label: "Tipe ibadah",
            kind: "select",
            options: [{ value: "", label: "Semua tipe" }, ...types.options],
          },
          {
            key: "bulan",
            label: "Bulan",
            kind: "select",
            options: MONTH_OPTIONS,
          },
        ]}
      />

      <DataList
        items={ibadahList.items}
        getKey={(ibadah) => ibadah.code}
        label="Daftar ibadah"
        isLoading={ibadahList.isLoading}
        isRefreshing={ibadahList.isRefreshing}
        error={ibadahList.error}
        onRetry={ibadahList.onRetry}
        emptyTitle={
          listParams.search || listParams.isFiltered
            ? "Tidak ada ibadah"
            : "Belum ada ibadah tercatat"
        }
        emptyDescription={
          listParams.search || listParams.isFiltered
            ? "Tidak ada ibadah yang cocok dengan pencarian atau filter ini."
            : "Catat ibadah pertama. Tipe, tanggal, dan jam mulai sudah cukup; jumlah hadir bisa diisi sesudah ibadah."
        }
        onClearFilter={
          listParams.isFiltered ? listParams.onClearFilters : undefined
        }
        pagination={ibadahList.pagination}
        table={ibadahTable(isCanUpdate)}
        itemNoun="ibadah"
      >
        {(ibadah) => (
          <IbadahListItemRow ibadah={ibadah} isCanUpdate={isCanUpdate} />
        )}
      </DataList>
    </div>
  );
};
