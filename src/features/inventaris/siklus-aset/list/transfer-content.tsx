"use client";

import { DataList, ListToolbar } from "@/components/common/list";
import { useListParams, type ListFilterSchema } from "@/hooks/use-list-params";

import { useTransferList } from "../api";

import { ListHeader } from "./list-header";
import { EMPTY_FILTERED, MONTH_FILTER, SEARCH } from "./list-options";
import { TransferItem, transferTable } from "./transfer-item";

const LIST_FILTERS = { bulan: { api: "bulan" } } satisfies ListFilterSchema;

export const TransferContent = () => {
  const listParams = useListParams({ filters: LIST_FILTERS });
  const list = useTransferList(listParams);
  const isFiltered = Boolean(listParams.search) || listParams.isFiltered;

  return (
    <div className="pb-6">
      <ListHeader
        kind="pindah"
        totalData={list.totalData}
        listParams={listParams}
      />

      <ListToolbar
        listParams={listParams}
        {...SEARCH}
        filters={[MONTH_FILTER]}
      />

      <DataList
        loadingShape="trailing"
        items={list.items}
        getKey={(row) => row.code}
        label="Daftar pindah lokasi"
        isLoading={list.isLoading}
        isRefreshing={list.isRefreshing}
        error={list.error}
        onRetry={list.onRetry}
        emptyTitle={
          isFiltered ? EMPTY_FILTERED.title : "Belum ada pindah lokasi"
        }
        emptyDescription={
          isFiltered
            ? EMPTY_FILTERED.description
            : "Barang yang dipindah ruang atau badan pelayanannya tercatat di sini."
        }
        onClearFilter={
          listParams.isFiltered ? listParams.onClearFilters : undefined
        }
        pagination={list.pagination}
        table={transferTable}
        itemNoun="pindah lokasi"
      >
        {(row) => <TransferItem row={row} />}
      </DataList>
    </div>
  );
};
