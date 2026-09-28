"use client";

import { DataList, ListToolbar } from "@/components/common/list";
import { PageHeader, PageHeaderAdd } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useListParams } from "@/hooks/use-list-params";

import { useRuangList } from "../api";
import { RUANG_CREATE_PATH } from "../model";
import { ROOM_STATUS_FILTER } from "../types";

import { RuangListItemRow, ruangTable } from "./list-item";

export const RuangListContent = () => {
  const { isCanCreate, isCanUpdate } = useMenuAccess(MENU.RUANG);
  const listParams = useListParams();
  const ruangList = useRuangList(listParams);
  const isNarrowed = Boolean(listParams.search) || listParams.isFiltered;

  return (
    <div className="pb-6">
      <PageHeader
        title="Ruang"
        subtitle={
          ruangList.totalData === undefined
            ? undefined
            : `${ruangList.totalData} ruang`
        }
        backHref={domainHref(MENU.FASILITAS)}
        action={
          isCanCreate ? (
            <PageHeaderAdd href={RUANG_CREATE_PATH} label="Tambah ruang" />
          ) : null
        }
      />

      <ListToolbar
        listParams={listParams}
        searchLabel="Cari ruang"
        searchPlaceholder="Cari nama ruang"
        filters={[
          {
            key: "status",
            label: "Status",
            kind: "choice",
            options: ROOM_STATUS_FILTER,
          },
        ]}
      />

      <DataList
        items={ruangList.items}
        getKey={(room) => room.code}
        label="Daftar ruang"
        isLoading={ruangList.isLoading}
        isRefreshing={ruangList.isRefreshing}
        error={ruangList.error}
        onRetry={ruangList.onRetry}
        emptyTitle={isNarrowed ? "Tidak ada ruang" : "Belum ada ruang"}
        emptyDescription={
          isNarrowed
            ? "Tidak ada ruang yang cocok dengan filter ini."
            : "Tambahkan ruang gereja yang bisa dipinjam atau dipakai ibadah dan kegiatan."
        }
        onClearFilter={
          listParams.isFiltered ? listParams.onClearFilters : undefined
        }
        pagination={ruangList.pagination}
        table={ruangTable(isCanUpdate)}
        itemNoun="ruang"
      >
        {(room) => <RuangListItemRow room={room} isCanUpdate={isCanUpdate} />}
      </DataList>
    </div>
  );
};
