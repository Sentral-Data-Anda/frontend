"use client";

import { DataList, ListToolbar } from "@/components/common/list";
import { PageHeader, PageHeaderAdd } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useListParams } from "@/hooks/use-list-params";
import { monthOptions } from "@/lib/date";

import { useMutasiList } from "../api";
import {
  MUTASI_CREATE_PATH,
  MUTASI_FILTERS,
  SOURCE_FILTER_OPTIONS,
  TYPE_FILTER_OPTIONS,
} from "../model";

import { MutasiListItemRow, mutasiTable } from "./list-item";

export const MutasiListContent = () => {
  const { isCanCreate } = useMenuAccess(MENU.MUTASI_STOK);
  const { isCanView: isCanViewItem } = useMenuAccess(MENU.BARANG_PERSEDIAAN);
  const listParams = useListParams({ filters: MUTASI_FILTERS });
  const mutasiList = useMutasiList(listParams);
  const isNarrowed = Boolean(listParams.search) || listParams.isFiltered;
  const months = [{ value: "", label: "Semua bulan" }, ...monthOptions()];

  return (
    <div className="pb-6">
      <PageHeader
        title="Mutasi Stok"
        subtitle={
          mutasiList.totalData === undefined
            ? undefined
            : `${mutasiList.totalData} mutasi`
        }
        backHref={domainHref(MENU.INVENTARIS)}
        action={
          isCanCreate ? (
            <PageHeaderAdd
              href={MUTASI_CREATE_PATH}
              label="Catat mutasi"
              text="Catat mutasi"
            />
          ) : null
        }
      />

      <ListToolbar
        listParams={listParams}
        searchLabel="Cari mutasi"
        searchPlaceholder="Cari nama atau kode barang"
        filters={[
          { key: "bulan", label: "Bulan", kind: "select", options: months },
          {
            key: "jenis",
            label: "Jenis",
            kind: "choice",
            options: TYPE_FILTER_OPTIONS,
          },
          {
            key: "sumber",
            label: "Sumber",
            kind: "select",
            options: SOURCE_FILTER_OPTIONS,
          },
        ]}
      />

      <DataList
        loadingShape="trailing"
        items={mutasiList.items}
        getKey={(movement) => movement.publicId}
        label="Daftar mutasi stok"
        isLoading={mutasiList.isLoading}
        isRefreshing={mutasiList.isRefreshing}
        error={mutasiList.error}
        onRetry={mutasiList.onRetry}
        emptyTitle={isNarrowed ? "Tidak ada mutasi" : "Belum ada mutasi stok"}
        emptyDescription={
          isNarrowed
            ? "Tidak ada mutasi yang cocok dengan filter ini."
            : "Catat barang masuk dan keluar agar stok selalu sesuai."
        }
        onClearFilter={
          listParams.isFiltered ? listParams.onClearFilters : undefined
        }
        pagination={mutasiList.pagination}
        table={mutasiTable(isCanViewItem)}
        itemNoun="mutasi"
      >
        {(movement) => (
          <MutasiListItemRow
            movement={movement}
            isCanViewItem={isCanViewItem}
          />
        )}
      </DataList>
    </div>
  );
};
