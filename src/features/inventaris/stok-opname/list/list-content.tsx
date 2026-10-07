"use client";

import { DataList, ListToolbar } from "@/components/common/list";
import { PageHeader, PageHeaderAdd } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useDdlOptions } from "@/hooks/use-ddl-options";
import { useListParams, type ListFilterSchema } from "@/hooks/use-list-params";
import { monthOptions } from "@/lib/date";

import { useOpnameList } from "../api";
import { OPNAME_CREATE_PATH, STATUS_OPTIONS } from "../model";

import { OpnameListItemRow, opnameTable } from "./list-item";

const LIST_FILTERS = {
  bulan: { api: "bulan" },
  ruang: { api: "roomId" },
} satisfies ListFilterSchema;

export const OpnameListContent = () => {
  const { isCanCreate, isCanUpdate } = useMenuAccess(MENU.STOK_OPNAME);
  const listParams = useListParams({ filters: LIST_FILTERS });
  const opnameList = useOpnameList(listParams);
  const rooms = useDdlOptions("room", "id", listParams.filters.ruang);
  const isNarrowed = Boolean(listParams.search) || listParams.isFiltered;

  return (
    <div className="pb-6">
      <PageHeader
        title="Stok Opname"
        subtitle={
          opnameList.totalData === undefined
            ? undefined
            : `${opnameList.totalData} stok opname`
        }
        backHref={domainHref(MENU.INVENTARIS)}
        action={
          isCanCreate ? (
            <PageHeaderAdd
              href={OPNAME_CREATE_PATH}
              label="Tambah stok opname"
            />
          ) : null
        }
      />

      <ListToolbar
        listParams={listParams}
        searchLabel="Cari stok opname"
        searchPlaceholder="Cari kode"
        filters={[
          {
            key: "bulan",
            label: "Bulan",
            kind: "select",
            options: [{ value: "", label: "Semua bulan" }, ...monthOptions()],
          },
          {
            key: "status",
            label: "Status",
            kind: "select",
            options: [{ value: "", label: "Semua status" }, ...STATUS_OPTIONS],
          },
          {
            key: "ruang",
            label: "Ruang",
            kind: "select",
            options: [{ value: "", label: "Semua ruang" }, ...rooms.options],
          },
        ]}
      />

      <DataList
        loadingShape="trailing"
        items={opnameList.items}
        getKey={(opname) => opname.code}
        label="Daftar stok opname"
        isLoading={opnameList.isLoading}
        isRefreshing={opnameList.isRefreshing}
        error={opnameList.error}
        onRetry={opnameList.onRetry}
        emptyTitle={
          isNarrowed ? "Tidak ada stok opname" : "Belum ada stok opname"
        }
        emptyDescription={
          isNarrowed
            ? "Tidak ada stok opname yang cocok dengan filter ini."
            : "Hitung barang persediaan di satu ruang lalu cocokkan dengan stok di aplikasi."
        }
        onClearFilter={
          listParams.isFiltered ? listParams.onClearFilters : undefined
        }
        pagination={opnameList.pagination}
        table={opnameTable(isCanUpdate)}
        itemNoun="stok opname"
      >
        {(opname) => (
          <OpnameListItemRow opname={opname} isCanUpdate={isCanUpdate} />
        )}
      </DataList>
    </div>
  );
};
