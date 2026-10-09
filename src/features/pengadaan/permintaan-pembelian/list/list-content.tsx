"use client";

import { DataList, ListTabs, ListToolbar } from "@/components/common/list";
import { PageHeader, PageHeaderAdd } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useDdlOptions } from "@/hooks/use-ddl-options";
import { useListParams, type ListFilterSchema } from "@/hooks/use-list-params";
import { monthOptions } from "@/lib/date";

import { useRequestList } from "../api";
import { MINE, REQUEST_CREATE_PATH, STATUS_TABS } from "../model";

import { RequestListItem, requestTable } from "./list-item";

const LIST_FILTERS = {
  bulan: { api: "bulan" },
  badan: { api: "bapelId" },
  pengaju: { api: "requestedBy" },
} satisfies ListFilterSchema;

export const RequestListContent = () => {
  const { isCanCreate, isCanUpdate } = useMenuAccess(MENU.PURCHASE_REQUEST);
  const listParams = useListParams({ filters: LIST_FILTERS });
  const requestList = useRequestList(listParams);
  const bapels = useDdlOptions("bapel", "id", listParams.filters.badan);
  const isNarrowed = Boolean(listParams.search) || listParams.isFiltered;

  return (
    <div className="pb-6">
      <PageHeader
        title="Permintaan Pembelian"
        subtitle={
          requestList.totalData === undefined
            ? undefined
            : `${requestList.totalData} permintaan`
        }
        backHref={domainHref(MENU.PROCUREMENT)}
        action={
          isCanCreate ? (
            <PageHeaderAdd
              href={REQUEST_CREATE_PATH}
              label="Tambah permintaan pembelian"
            />
          ) : null
        }
      />

      <ListTabs
        label="Status permintaan"
        value={listParams.status}
        options={STATUS_TABS}
        onValueChange={(status) => listParams.onPickFilter("status", status)}
      />

      <ListToolbar
        listParams={listParams}
        searchLabel="Cari permintaan"
        searchPlaceholder="Cari kode atau keperluan"
        filters={[
          {
            key: "bulan",
            label: "Bulan",
            kind: "select",
            options: [{ value: "", label: "Semua bulan" }, ...monthOptions()],
          },
          {
            key: "badan",
            label: "Badan pelayanan",
            kind: "select",
            options: [
              { value: "", label: "Semua badan pelayanan" },
              ...bapels.options,
            ],
          },
          {
            key: "pengaju",
            label: "Pengaju",
            kind: "choice",
            options: [
              { value: "", label: "Semua" },
              { value: MINE, label: "Punya saya" },
            ],
          },
        ]}
      />

      <DataList
        loadingShape="trailing"
        items={requestList.items}
        getKey={(row) => row.code}
        label="Daftar permintaan pembelian"
        isLoading={requestList.isLoading}
        isRefreshing={requestList.isRefreshing}
        error={requestList.error}
        onRetry={requestList.onRetry}
        emptyTitle={
          isNarrowed ? "Tidak ada permintaan" : "Belum ada permintaan pembelian"
        }
        emptyDescription={
          isNarrowed
            ? "Tidak ada permintaan yang cocok dengan filter ini."
            : "Ajukan kebutuhan barang badan pelayanan untuk disetujui."
        }
        onClearFilter={
          listParams.isFiltered ? listParams.onClearFilters : undefined
        }
        pagination={requestList.pagination}
        table={requestTable(isCanUpdate)}
        itemNoun="permintaan"
      >
        {(row) => <RequestListItem row={row} isCanUpdate={isCanUpdate} />}
      </DataList>
    </div>
  );
};
