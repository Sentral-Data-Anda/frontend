"use client";

import { DataList, ListTabs, ListToolbar } from "@/components/common/list";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useListParams, type ListFilterSchema } from "@/hooks/use-list-params";

import { useTransferList } from "../api";
import { MONTH_ALL, STATUS_TABS, monthFilterOptions } from "../model";

import { TransferAddMenu } from "./add-menu";
import { TransferListItemRow, transferTable } from "./list-item";

const LIST_FILTERS = {
  // URL kosong = bulan ini, yang menyaring; "semua" yang tidak.
  bulan: { api: "bulan", defaultValue: MONTH_ALL },
} satisfies ListFilterSchema;

export const TransferListContent = () => {
  const { isCanCreate } = useMenuAccess(MENU.SETORAN);
  const listParams = useListParams({ filters: LIST_FILTERS });
  const transferList = useTransferList(listParams);
  const isNarrowed = Boolean(listParams.search) || listParams.isFiltered;

  const onShowAll = () =>
    listParams.onApplyFilters({ bulan: MONTH_ALL, status: "", search: "" });

  return (
    <div className="pb-6">
      <PageHeader
        title="Setoran"
        subtitle={
          transferList.totalData === undefined
            ? undefined
            : `${transferList.totalData} setoran`
        }
        backHref={domainHref(MENU.KEUANGAN)}
        action={isCanCreate ? <TransferAddMenu /> : null}
      />

      <ListTabs
        label="Status setoran"
        value={listParams.status}
        options={STATUS_TABS}
        onValueChange={(status) => listParams.onPickFilter("status", status)}
      />

      <ListToolbar
        listParams={listParams}
        searchLabel="Cari setoran"
        searchPlaceholder="Cari kode, keterangan, atau referensi"
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
        items={transferList.items}
        getKey={(transfer) => transfer.code}
        label="Daftar setoran"
        isLoading={transferList.isLoading}
        isRefreshing={transferList.isRefreshing}
        error={transferList.error}
        onRetry={transferList.onRetry}
        emptyTitle={isNarrowed ? "Tidak ada setoran" : "Belum ada setoran"}
        emptyDescription={
          isNarrowed
            ? "Tidak ada setoran yang cocok dengan pencarian atau filter ini. Bawaannya hanya bulan berjalan."
            : "Catat uang yang dipindahkan antar kas dan bank gereja."
        }
        onClearFilter={isNarrowed ? onShowAll : undefined}
        pagination={transferList.pagination}
        table={transferTable()}
        itemNoun="setoran"
      >
        {(transfer) => <TransferListItemRow transfer={transfer} />}
      </DataList>
    </div>
  );
};
