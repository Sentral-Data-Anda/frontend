"use client";

import { optionsOf } from "@/components/common/control";
import { DataList, ListToolbar } from "@/components/common/list";
import { PageHeader, PageHeaderAdd } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useDdlOptions } from "@/hooks/use-ddl-options";
import { useListParams, type ListFilterSchema } from "@/hooks/use-list-params";

import { useAssetList } from "../api";
import { LabelLink, labelHrefOf } from "../label";
import {
  BARANG_CREATE_PATH,
  CONDITION_LABEL,
  SOURCE_LABEL,
  STATUS_FILTER_LABEL,
} from "../model";

import { BarangListItemRow, barangTable } from "./list-item";

const LIST_FILTERS = {
  kondisi: { api: "condition" },
  sumber: { api: "acquisitionSource" },
  tipe: { api: "typeId" },
  ruang: { api: "roomId" },
  bapel: { api: "bapelId" },
} satisfies ListFilterSchema;

const ALL = { value: "", label: "Semua" };

const STATUS_OPTIONS = [ALL, ...optionsOf(STATUS_FILTER_LABEL)];

const CONDITION_OPTIONS = [
  { value: "", label: "Semua kondisi" },
  ...optionsOf(CONDITION_LABEL),
];

const SOURCE_OPTIONS = [ALL, ...optionsOf(SOURCE_LABEL)];

export const BarangListContent = () => {
  const { isCanCreate, isCanUpdate } = useMenuAccess(MENU.BARANG);
  const listParams = useListParams({ filters: LIST_FILTERS });
  const assetList = useAssetList(listParams);
  const types = useDdlOptions("type-item", "id", listParams.filters.tipe);
  const rooms = useDdlOptions("room", "id", listParams.filters.ruang);
  const bapels = useDdlOptions("bapel", "id", listParams.filters.bapel);
  const isNarrowed = Boolean(listParams.search) || listParams.isFiltered;

  return (
    <div className="pb-6">
      <PageHeader
        title="Barang"
        subtitle={
          assetList.totalData === undefined
            ? undefined
            : `${assetList.totalData} barang`
        }
        backHref={domainHref(MENU.INVENTARIS)}
        action={
          <>
            <LabelLink
              href={labelHrefOf({
                search: listParams.search,
                status: listParams.status,
                ...listParams.filters,
              })}
            />
            {isCanCreate ? (
              <PageHeaderAdd href={BARANG_CREATE_PATH} label="Tambah barang" />
            ) : null}
          </>
        }
      />

      <ListToolbar
        listParams={listParams}
        searchLabel="Cari barang"
        searchPlaceholder="Cari nama, kode, atau nomor seri"
        filters={[
          {
            key: "status",
            label: "Status",
            kind: "choice",
            options: STATUS_OPTIONS,
            chipLabel: (label) =>
              label === STATUS_FILTER_LABEL.menunggu
                ? "Menunggu pelepasan"
                : label,
          },
          {
            key: "kondisi",
            label: "Kondisi",
            kind: "select",
            options: CONDITION_OPTIONS,
          },
          {
            key: "sumber",
            label: "Sumber",
            kind: "choice",
            options: SOURCE_OPTIONS,
          },
          {
            key: "tipe",
            label: "Tipe",
            kind: "select",
            options: [{ value: "", label: "Semua tipe" }, ...types.options],
          },
          {
            key: "ruang",
            label: "Ruang",
            kind: "select",
            options: [{ value: "", label: "Semua ruang" }, ...rooms.options],
          },
          {
            key: "bapel",
            label: "Badan pelayanan",
            kind: "select",
            options: [
              { value: "", label: "Semua badan pelayanan" },
              ...bapels.options,
            ],
          },
        ]}
      />

      <DataList
        items={assetList.items}
        getKey={(asset) => asset.code}
        label="Daftar barang"
        isLoading={assetList.isLoading}
        isRefreshing={assetList.isRefreshing}
        error={assetList.error}
        onRetry={assetList.onRetry}
        emptyTitle={isNarrowed ? "Tidak ada barang" : "Belum ada barang"}
        emptyDescription={
          isNarrowed
            ? "Tidak ada barang yang cocok dengan filter ini."
            : "Catat aset gereja seperti proyektor, alat musik, atau kendaraan."
        }
        onClearFilter={
          listParams.isFiltered ? listParams.onClearFilters : undefined
        }
        pagination={assetList.pagination}
        table={barangTable(isCanUpdate)}
        itemNoun="barang"
      >
        {(asset) => (
          <BarangListItemRow asset={asset} isCanUpdate={isCanUpdate} />
        )}
      </DataList>
    </div>
  );
};
