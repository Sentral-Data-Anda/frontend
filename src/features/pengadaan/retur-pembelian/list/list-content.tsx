"use client";

import { DataList, ListTabs, ListToolbar } from "@/components/common/list";
import { PageHeader, PageHeaderAdd } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useDdlOptions } from "@/hooks/use-ddl-options";
import { useListParams, type ListFilterSchema } from "@/hooks/use-list-params";

import { useReturnList } from "../api";
import { RETURN_CREATE_PATH, STATUS_TABS } from "../model";

import { ReturnListItem, returnTable } from "./list-item";

// Tanpa kotak cari: daftar retur di be-sada hanya menyaring `supplierId` dan
// `status`, jadi kotak cari akan terlihat bekerja tanpa mengubah apa pun.
const LIST_FILTERS = {
  supplier: { api: "supplierId" },
} satisfies ListFilterSchema;

export const ReturnListContent = () => {
  const { isCanCreate, isCanUpdate } = useMenuAccess(MENU.PURCHASE_RETURN);
  const listParams = useListParams({ filters: LIST_FILTERS });
  const returnList = useReturnList(listParams);
  const suppliers = useDdlOptions(
    "supplier",
    "id",
    listParams.filters.supplier,
  );
  const isNarrowed = listParams.isFiltered || Boolean(listParams.status);

  return (
    <div className="pb-6">
      <PageHeader
        title="Retur Pembelian"
        subtitle={
          returnList.totalData === undefined
            ? undefined
            : `${returnList.totalData} retur`
        }
        backHref={domainHref(MENU.PROCUREMENT)}
        action={
          isCanCreate ? (
            <PageHeaderAdd
              href={RETURN_CREATE_PATH}
              label="Tambah retur pembelian"
            />
          ) : null
        }
      />

      <ListTabs
        label="Status retur"
        value={listParams.status}
        options={STATUS_TABS}
        onValueChange={(status) => listParams.onPickFilter("status", status)}
      />

      <ListToolbar
        listParams={listParams}
        filters={[
          {
            key: "supplier",
            label: "Supplier",
            kind: "select",
            options: [
              { value: "", label: "Semua supplier" },
              ...suppliers.options,
            ],
          },
        ]}
      />

      <DataList
        loadingShape="trailing"
        items={returnList.items}
        getKey={(row) => row.publicId}
        label="Daftar retur pembelian"
        isLoading={returnList.isLoading}
        isRefreshing={returnList.isRefreshing}
        error={returnList.error}
        onRetry={returnList.onRetry}
        emptyTitle={
          isNarrowed ? "Tidak ada retur" : "Belum ada retur pembelian"
        }
        emptyDescription={
          isNarrowed
            ? "Tidak ada retur yang cocok dengan filter ini."
            : "Kembalikan barang yang tidak sesuai ke supplier yang mengirimnya."
        }
        onClearFilter={
          listParams.isFiltered ? listParams.onClearFilters : undefined
        }
        pagination={returnList.pagination}
        table={returnTable(isCanUpdate)}
        itemNoun="retur"
      >
        {(row) => <ReturnListItem row={row} isCanUpdate={isCanUpdate} />}
      </DataList>
    </div>
  );
};
