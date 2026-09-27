"use client";

import { DataList, ListToolbar } from "@/components/common/list";
import { PageHeader, PageHeaderAdd } from "@/components/layout";
import { MENU, createHref, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useListParams } from "@/hooks/use-list-params";

import { useTipeIbadahList } from "../api";
import { TIPE_IBADAH_STATUS_OPTIONS } from "../types";

import { TipeIbadahListItemRow, tipeIbadahTable } from "./list-item";

export const TipeIbadahList = () => {
  const { isCanCreate, isCanUpdate } = useMenuAccess(MENU.TIPE_IBADAH);
  const listParams = useListParams();
  const tipeIbadahList = useTipeIbadahList(listParams);
  const isNarrowed = Boolean(listParams.search) || listParams.isFiltered;

  return (
    <div className="pb-6">
      <PageHeader
        title="Tipe Ibadah"
        subtitle={
          tipeIbadahList.totalData === undefined
            ? undefined
            : `${tipeIbadahList.totalData} tipe`
        }
        backHref={domainHref(MENU.PERIBADAHAN)}
        action={
          isCanCreate ? (
            <PageHeaderAdd
              href={createHref(MENU.PERIBADAHAN, MENU.TIPE_IBADAH)}
              label="Tambah tipe ibadah"
            />
          ) : null
        }
      />

      <ListToolbar
        listParams={listParams}
        searchLabel="Cari tipe ibadah"
        searchPlaceholder="Cari nama atau kode tipe"
        filters={[
          {
            key: "status",
            label: "Status",
            kind: "choice",
            options: TIPE_IBADAH_STATUS_OPTIONS,
          },
        ]}
      />

      <DataList
        items={tipeIbadahList.items}
        getKey={(tipeIbadah) => tipeIbadah.code}
        label="Daftar tipe ibadah"
        isLoading={tipeIbadahList.isLoading}
        isRefreshing={tipeIbadahList.isRefreshing}
        error={tipeIbadahList.error}
        onRetry={tipeIbadahList.onRetry}
        emptyTitle={
          isNarrowed ? "Tidak ada tipe ibadah" : "Belum ada tipe ibadah"
        }
        emptyDescription={
          isNarrowed
            ? "Tidak ada tipe ibadah yang cocok dengan pencarian atau filter ini."
            : "Tambahkan jenis ibadah yang diadakan gereja, mis. Ibadah Minggu, Persekutuan Doa, Ibadah Pemuda."
        }
        onClearFilter={
          listParams.isFiltered ? listParams.onClearFilters : undefined
        }
        pagination={tipeIbadahList.pagination}
        table={tipeIbadahTable(isCanUpdate)}
        itemNoun="tipe ibadah"
      >
        {(tipeIbadah) => (
          <TipeIbadahListItemRow
            tipeIbadah={tipeIbadah}
            isCanUpdate={isCanUpdate}
          />
        )}
      </DataList>
    </div>
  );
};
