"use client";

import { DataList, ListTabs, ListToolbar } from "@/components/common/list";
import { PageHeader, PageHeaderAdd } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useDdlOptions } from "@/hooks/use-ddl-options";
import { useListParams, type ListFilterSchema } from "@/hooks/use-list-params";
import { monthOptions } from "@/lib/date";

import { useOrderList } from "../api";
import { ORDER_CREATE_PATH, STATUS_TABS } from "../model";

import { OrderListItemRow, orderTable } from "./list-item";

const LIST_FILTERS = {
  bulan: { api: "bulan" },
  supplier: { api: "supplierId" },
} satisfies ListFilterSchema;

export const OrderListContent = () => {
  const { isCanCreate, isCanUpdate } = useMenuAccess(MENU.PURCHASE_ORDER);
  const listParams = useListParams({ filters: LIST_FILTERS });
  const orderList = useOrderList(listParams);
  const suppliers = useDdlOptions(
    "supplier",
    "id",
    listParams.filters.supplier,
  );
  const isNarrowed = Boolean(listParams.search) || listParams.isFiltered;

  return (
    <div className="pb-6">
      <PageHeader
        title="Pesanan Pembelian"
        subtitle={
          orderList.totalData === undefined
            ? undefined
            : `${orderList.totalData} pesanan`
        }
        backHref={domainHref(MENU.PROCUREMENT)}
        action={
          isCanCreate ? (
            <PageHeaderAdd
              href={ORDER_CREATE_PATH}
              label="Tambah pesanan pembelian"
            />
          ) : null
        }
      />

      <ListTabs
        label="Status pesanan"
        value={listParams.status}
        options={STATUS_TABS}
        onValueChange={(status) => listParams.onPickFilter("status", status)}
      />

      <ListToolbar
        listParams={listParams}
        searchLabel="Cari pesanan pembelian"
        searchPlaceholder="Cari kode atau supplier"
        filters={[
          {
            key: "bulan",
            label: "Bulan",
            kind: "select",
            options: [{ value: "", label: "Semua bulan" }, ...monthOptions()],
          },
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
        items={orderList.items}
        getKey={(order) => order.code}
        label="Daftar pesanan pembelian"
        isLoading={orderList.isLoading}
        isRefreshing={orderList.isRefreshing}
        error={orderList.error}
        onRetry={orderList.onRetry}
        emptyTitle={
          isNarrowed
            ? "Tidak ada pesanan pembelian"
            : "Belum ada pesanan pembelian"
        }
        emptyDescription={
          isNarrowed
            ? "Tidak ada pesanan pembelian yang cocok dengan filter ini."
            : "Catat apa yang dibeli dari supplier, dari permintaan yang sudah disetujui."
        }
        onClearFilter={
          listParams.isFiltered ? listParams.onClearFilters : undefined
        }
        pagination={orderList.pagination}
        table={orderTable(isCanUpdate)}
        itemNoun="pesanan"
      >
        {(order) => (
          <OrderListItemRow order={order} isCanUpdate={isCanUpdate} />
        )}
      </DataList>
    </div>
  );
};
