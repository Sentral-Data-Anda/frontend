"use client";

import { optionsOf } from "@/components/common/control";
import { DataList, ListToolbar } from "@/components/common/list";
import { useListParams, type ListFilterSchema } from "@/hooks/use-list-params";

import { useDisposalList } from "../api";
import { DISPOSAL_METHOD_LABEL, DISPOSAL_STATUS_LABEL } from "../model";

import { DisposalItem, disposalTable } from "./disposal-item";
import { ListHeader } from "./list-header";
import { EMPTY_FILTERED, MONTH_FILTER, SEARCH } from "./list-options";

const LIST_FILTERS = {
  bulan: { api: "bulan" },
  cara: { api: "cara" },
} satisfies ListFilterSchema;

const STATUS_OPTIONS = [
  { value: "", label: "Semua status" },
  ...optionsOf(DISPOSAL_STATUS_LABEL),
];

const METHOD_OPTIONS = [
  { value: "", label: "Semua cara" },
  ...optionsOf(DISPOSAL_METHOD_LABEL),
];

export const DisposalContent = () => {
  const listParams = useListParams({ filters: LIST_FILTERS });
  const list = useDisposalList(listParams);
  const isFiltered = Boolean(listParams.search) || listParams.isFiltered;

  return (
    <div className="pb-6">
      <ListHeader
        kind="pelepasan"
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
          {
            key: "cara",
            label: "Cara",
            kind: "choice",
            options: METHOD_OPTIONS,
          },
        ]}
      />

      <DataList
        loadingShape="trailing"
        items={list.items}
        getKey={(row) => row.code}
        label="Daftar pelepasan"
        isLoading={list.isLoading}
        isRefreshing={list.isRefreshing}
        error={list.error}
        onRetry={list.onRetry}
        emptyTitle={isFiltered ? EMPTY_FILTERED.title : "Belum ada pelepasan"}
        emptyDescription={
          isFiltered
            ? EMPTY_FILTERED.description
            : "Barang yang dijual, dimusnahkan, dihibahkan, atau hilang tercatat di sini."
        }
        onClearFilter={
          listParams.isFiltered ? listParams.onClearFilters : undefined
        }
        pagination={list.pagination}
        table={disposalTable}
        itemNoun="pelepasan"
      >
        {(row) => <DisposalItem row={row} />}
      </DataList>
    </div>
  );
};
