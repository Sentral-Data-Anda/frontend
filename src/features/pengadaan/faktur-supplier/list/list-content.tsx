"use client";

import { DataList, ListTabs, ListToolbar } from "@/components/common/list";
import { PageHeader, PageHeaderAdd } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useDdlOptions } from "@/hooks/use-ddl-options";
import { useListParams, type ListFilterSchema } from "@/hooks/use-list-params";

import { useInvoiceList } from "../api";
import {
  EMPTY_DESCRIPTION,
  EMPTY_TITLE,
  INVOICE_CREATE_PATH,
  STATUS_TABS,
} from "../model";

import { InvoiceListItemRow, invoiceTable } from "./list-item";

const LIST_FILTERS = {
  supplier: { api: "supplierId" },
} satisfies ListFilterSchema;

export const InvoiceListContent = () => {
  const { isCanCreate, isCanUpdate } = useMenuAccess(MENU.SUPPLIER_INVOICE);
  const listParams = useListParams({ filters: LIST_FILTERS });
  const invoiceList = useInvoiceList(listParams);
  const suppliers = useDdlOptions(
    "supplier",
    "id",
    listParams.filters.supplier,
  );
  const isNarrowed = Boolean(listParams.search) || listParams.isFiltered;

  return (
    <div className="pb-6">
      <PageHeader
        title="Faktur Supplier"
        subtitle={
          invoiceList.totalData === undefined
            ? undefined
            : `${invoiceList.totalData} faktur`
        }
        backHref={domainHref(MENU.PROCUREMENT)}
        action={
          isCanCreate ? (
            <PageHeaderAdd
              href={INVOICE_CREATE_PATH}
              label="Tambah faktur supplier"
            />
          ) : null
        }
      />

      <ListTabs
        label="Status faktur"
        value={listParams.status}
        options={STATUS_TABS}
        onValueChange={(status) => listParams.onPickFilter("status", status)}
      />

      <ListToolbar
        listParams={listParams}
        searchLabel="Cari faktur supplier"
        searchPlaceholder="Cari kode atau nomor faktur"
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
        items={invoiceList.items}
        getKey={(invoice) => invoice.publicId}
        label="Daftar faktur supplier"
        isLoading={invoiceList.isLoading}
        isRefreshing={invoiceList.isRefreshing}
        error={invoiceList.error}
        onRetry={invoiceList.onRetry}
        emptyTitle={isNarrowed ? "Tidak ada faktur supplier" : EMPTY_TITLE}
        emptyDescription={
          isNarrowed
            ? "Tidak ada faktur yang cocok dengan filter ini."
            : EMPTY_DESCRIPTION
        }
        onClearFilter={
          listParams.isFiltered ? listParams.onClearFilters : undefined
        }
        pagination={invoiceList.pagination}
        table={invoiceTable(isCanUpdate)}
        itemNoun="faktur"
      >
        {(invoice) => (
          <InvoiceListItemRow invoice={invoice} isCanUpdate={isCanUpdate} />
        )}
      </DataList>
    </div>
  );
};
