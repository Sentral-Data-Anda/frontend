"use client";

import { DataList, ListTabs, ListToolbar } from "@/components/common/list";
import { PageHeader, PageHeaderAdd } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useListParams } from "@/hooks/use-list-params";

import { RECEIPT_FILTERS, useReceiptList } from "../api";
import {
  EMPTY_DESCRIPTION,
  EMPTY_TITLE,
  KAS_MASUK_CREATE_PATH,
  MONTH_ALL,
  PERSEMBAHAN_NOTE,
  STATUS_TABS,
  TITLE,
  monthFilterOptions,
} from "../model";

import { GatewayShortcut } from "./gateway-shortcut";
import { ReceiptListItemRow, receiptTable } from "./list-item";

export const ReceiptListContent = () => {
  const { isCanCreate, isCanUpdate } = useMenuAccess(MENU.KAS_MASUK);
  const listParams = useListParams({ filters: RECEIPT_FILTERS });
  const receiptList = useReceiptList(listParams);
  const isNarrowed = Boolean(listParams.search) || listParams.isFiltered;

  return (
    <div className="pb-6">
      <PageHeader
        title={TITLE}
        subtitle={
          receiptList.totalData === undefined
            ? undefined
            : `${receiptList.totalData} kas masuk`
        }
        backHref={domainHref(MENU.FINANCE)}
        action={
          isCanCreate ? (
            <span className="flex items-center gap-2">
              <GatewayShortcut />
              <PageHeaderAdd
                href={KAS_MASUK_CREATE_PATH}
                label="Tambah kas masuk"
              />
            </span>
          ) : null
        }
      />

      <ListTabs
        label="Status kas masuk"
        value={listParams.status}
        options={STATUS_TABS}
        onValueChange={(status) => listParams.onPickFilter("status", status)}
      />

      <ListToolbar
        listParams={listParams}
        searchLabel="Cari kas masuk"
        searchPlaceholder="Cari kode, pemberi, atau referensi"
        filters={[
          {
            key: "bulan",
            label: "Bulan",
            kind: "select",
            options: monthFilterOptions(),
            defaultValue: MONTH_ALL,
          },
        ]}
      />

      <DataList
        loadingShape="trailing"
        items={receiptList.items}
        getKey={(receipt) => receipt.publicId}
        label="Daftar kas masuk"
        isLoading={receiptList.isLoading}
        isRefreshing={receiptList.isRefreshing}
        error={receiptList.error}
        onRetry={receiptList.onRetry}
        emptyTitle={isNarrowed ? "Tidak ada kas masuk" : EMPTY_TITLE}
        emptyDescription={
          isNarrowed
            ? `Tidak ada kas masuk yang cocok dengan pencarian atau filter ini. Bawaannya hanya bulan berjalan. ${PERSEMBAHAN_NOTE}`
            : `${EMPTY_DESCRIPTION} ${PERSEMBAHAN_NOTE}`
        }
        onClearFilter={
          listParams.isFiltered ? listParams.onClearFilters : undefined
        }
        pagination={receiptList.pagination}
        table={receiptTable(isCanUpdate)}
        itemNoun="kas masuk"
      >
        {(receipt) => (
          <ReceiptListItemRow receipt={receipt} isCanUpdate={isCanUpdate} />
        )}
      </DataList>
    </div>
  );
};
