"use client";

import { useSearchParams } from "next/navigation";

import { ChoiceField } from "@/components/common/control";
import {
  DataList,
  ListToolbar,
  type ListFilter,
} from "@/components/common/list";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useListParams } from "@/hooks/use-list-params";

import { usePermintaanList } from "../api";
import {
  DOCUMENT_FILTER_OPTIONS,
  FILTERED_EMPTY,
  LIST_FILTERS,
  STATUS_FILTER_OPTIONS,
  VIEW_COPY,
  VIEW_OPTIONS,
  VIEW_PARAM,
  viewOf,
} from "../model";

import { PermintaanListItemRow, permintaanTable } from "./list-item";

const DOCUMENT_FILTER: ListFilter = {
  key: "jenis",
  label: "Jenis dokumen",
  kind: "select",
  options: DOCUMENT_FILTER_OPTIONS,
};

const STATUS_FILTER: ListFilter = {
  key: "status",
  label: "Status",
  kind: "choice",
  options: STATUS_FILTER_OPTIONS,
};

export const PermintaanList = () => {
  const searchParams = useSearchParams();
  const listParams = useListParams({ filters: LIST_FILTERS });
  const view = viewOf(searchParams.get(VIEW_PARAM));
  const permintaanList = usePermintaanList(listParams, view);
  const copy = VIEW_COPY[view];
  const isFiltered =
    Boolean(listParams.filters.jenis) ||
    (view === "pengajuan" && Boolean(listParams.status));

  const onPickView = (value: string) =>
    listParams.onApplyFilters({ [VIEW_PARAM]: value, status: "" });

  return (
    <div className="pb-6">
      <PageHeader
        title="Permintaan Persetujuan"
        subtitle={
          permintaanList.totalData === undefined
            ? undefined
            : copy.subtitle(permintaanList.totalData)
        }
        backHref={domainHref(MENU.PERSETUJUAN)}
      />

      <div className="px-gutter pb-3">
        <ChoiceField
          id="permintaan-tampil"
          label="Tampilkan"
          isLabelVisible={false}
          value={view === "menunggu" ? "" : view}
          onValueChange={onPickView}
          options={VIEW_OPTIONS}
        />
      </div>

      <ListToolbar
        listParams={listParams}
        filters={
          view === "pengajuan"
            ? [STATUS_FILTER, DOCUMENT_FILTER]
            : [DOCUMENT_FILTER]
        }
      />

      <DataList
        loadingShape="trailing"
        items={permintaanList.items}
        getKey={(item) => item.publicId}
        label="Daftar permintaan persetujuan"
        isLoading={permintaanList.isLoading}
        isRefreshing={permintaanList.isRefreshing}
        error={permintaanList.error}
        onRetry={permintaanList.onRetry}
        emptyTitle={isFiltered ? FILTERED_EMPTY : copy.title}
        emptyDescription={isFiltered ? undefined : copy.description}
        onClearFilter={isFiltered ? listParams.onClearFilters : undefined}
        pagination={permintaanList.pagination}
        table={permintaanTable(view)}
        itemNoun="permintaan"
      >
        {(item) => <PermintaanListItemRow item={item} view={view} />}
      </DataList>
    </div>
  );
};
