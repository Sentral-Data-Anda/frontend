"use client";

import { optionsOf } from "@/components/common/control";
import { DataList, ListToolbar } from "@/components/common/list";
import { MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useListParams, type ListFilterSchema } from "@/hooks/use-list-params";

import { useMaintenanceList } from "../api";
import { MAINTENANCE_STATUS_LABEL } from "../model";

import { ListHeader } from "./list-header";
import { EMPTY_FILTERED, MONTH_FILTER, SEARCH } from "./list-options";
import { MaintenanceItem, maintenanceTable } from "./maintenance-item";

const LIST_FILTERS = { bulan: { api: "bulan" } } satisfies ListFilterSchema;

const STATUS_OPTIONS = [
  { value: "", label: "Semua status" },
  ...optionsOf(MAINTENANCE_STATUS_LABEL),
];

export const MaintenanceContent = () => {
  const { isCanUpdate } = useMenuAccess(MENU.SIKLUS_ASET);
  const listParams = useListParams({ filters: LIST_FILTERS });
  const list = useMaintenanceList(listParams);
  const isFiltered = Boolean(listParams.search) || listParams.isFiltered;

  return (
    <div className="pb-6">
      <ListHeader
        kind="perawatan"
        totalData={list.totalData}
        listParams={listParams}
      />

      <ListToolbar
        listParams={listParams}
        {...SEARCH}
        filters={[
          MONTH_FILTER,
          {
            key: "status",
            label: "Status",
            kind: "choice",
            options: STATUS_OPTIONS,
          },
        ]}
      />

      <DataList
        items={list.items}
        getKey={(row) => row.code}
        label="Daftar perawatan"
        isLoading={list.isLoading}
        isRefreshing={list.isRefreshing}
        error={list.error}
        onRetry={list.onRetry}
        emptyTitle={isFiltered ? EMPTY_FILTERED.title : "Belum ada perawatan"}
        emptyDescription={
          isFiltered
            ? EMPTY_FILTERED.description
            : "Catat servis dan perbaikan barang di sini."
        }
        onClearFilter={
          listParams.isFiltered ? listParams.onClearFilters : undefined
        }
        pagination={list.pagination}
        table={maintenanceTable(isCanUpdate)}
        itemNoun="perawatan"
      >
        {(row) => <MaintenanceItem row={row} isCanUpdate={isCanUpdate} />}
      </DataList>
    </div>
  );
};
