"use client";

import { DataList, ListToolbar } from "@/components/common/list";
import { PageHeader, PageHeaderAdd } from "@/components/layout";
import { MENU, createHref, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useListParams, type ListFilterSchema } from "@/hooks/use-list-params";

import { useJemaatList, useZoneFilterOptions } from "../api";
import { STATUS_JEMAAT_OPTIONS, TYPE_JEMAAT_OPTIONS } from "../types";

import { JemaatListItemRow, jemaatTable } from "./list-item";

const LIST_FILTERS = {
  wilayah: { api: "zone" },
  tipe: { api: "type" },
  kelengkapan: { api: "incomplete" },
} satisfies ListFilterSchema;

export const JemaatListScreen = () => {
  const { isCanCreate, isCanUpdate } = useMenuAccess(MENU.DAFTAR_JEMAAT);
  const listParams = useListParams({ filters: LIST_FILTERS });
  const jemaatList = useJemaatList(listParams);
  const zoneOptions = useZoneFilterOptions(listParams.filters.wilayah ?? "");
  const isIncomplete = listParams.filters.kelengkapan === "true";
  const isOnlyIncomplete =
    isIncomplete &&
    !listParams.search &&
    !listParams.status &&
    !listParams.filters.wilayah &&
    !listParams.filters.tipe;

  const title = isIncomplete
    ? jemaatList.totalData === undefined
      ? "Jemaat belum lengkap"
      : `${jemaatList.totalData} jemaat belum lengkap`
    : "Daftar Jemaat";
  const subtitle =
    isIncomplete || jemaatList.totalData === undefined
      ? undefined
      : `${jemaatList.totalData} jemaat`;

  return (
    <div className="pb-6">
      <PageHeader
        title={title}
        subtitle={subtitle}
        backHref={domainHref(MENU.KEJEMAATAN)}
        action={
          isCanCreate ? (
            <PageHeaderAdd
              href={createHref(MENU.KEJEMAATAN, MENU.DAFTAR_JEMAAT)}
              label="Tambah jemaat"
            />
          ) : null
        }
      />

      <ListToolbar
        listParams={listParams}
        searchLabel="Cari jemaat"
        searchPlaceholder="Cari nama, kode, atau telepon"
        filters={[
          {
            key: "wilayah",
            label: "Wilayah",
            kind: "select",
            options: zoneOptions.options,
            emptyMessage: "Belum ada data wilayah",
          },
          {
            key: "status",
            label: "Status",
            kind: "choice",
            options: STATUS_JEMAAT_OPTIONS,
          },
          {
            key: "tipe",
            label: "Tipe jemaat",
            kind: "choice",
            options: TYPE_JEMAAT_OPTIONS,
          },
          {
            key: "kelengkapan",
            label: "Kelengkapan",
            kind: "choice",
            options: [
              { value: "", label: "Semua" },
              { value: "true", label: "Belum lengkap" },
            ],
          },
        ]}
      />

      <DataList
        items={jemaatList.items}
        getKey={(jemaat) => jemaat.code}
        label="Daftar jemaat"
        isLoading={jemaatList.isLoading}
        isRefreshing={jemaatList.isRefreshing}
        error={jemaatList.error}
        onRetry={jemaatList.onRetry}
        emptyTitle={
          isOnlyIncomplete ? "Semua jemaat sudah lengkap" : "Tidak ada jemaat"
        }
        emptyDescription={
          isOnlyIncomplete
            ? "Tidak ada jemaat yang perlu dilengkapi saat ini."
            : listParams.search || listParams.isFiltered
              ? "Tidak ada jemaat yang cocok dengan pencarian atau filter ini."
              : "Data jemaat akan muncul di sini setelah ditambahkan."
        }
        onClearFilter={
          listParams.isFiltered ? listParams.onClearFilters : undefined
        }
        pagination={jemaatList.pagination}
        table={jemaatTable(isCanUpdate)}
        itemNoun="jemaat"
      >
        {(jemaat) => (
          <JemaatListItemRow jemaat={jemaat} isCanUpdate={isCanUpdate} />
        )}
      </DataList>
    </div>
  );
};
