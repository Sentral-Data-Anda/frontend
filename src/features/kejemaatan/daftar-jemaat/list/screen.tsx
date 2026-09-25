"use client";

import { SearchInput, SelectField } from "@/components/common/control";
import { DataList, FilterChips, ListToolbar } from "@/components/common/list";
import { PageHeader, PageHeaderAdd } from "@/components/layout";
import { MENU, createHref, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useListParams, type ListFilterSchema } from "@/hooks/use-list-params";

import { useJemaatList, useZoneFilterOptions } from "../api";
import { STATUS_JEMAAT_CHIPS } from "../types";

import { JemaatListItemRow, jemaatTable } from "./list-item";

const LIST_FILTERS = { wilayah: { api: "zone" } } satisfies ListFilterSchema;

export const JemaatListScreen = () => {
  const { isCanCreate, isCanUpdate } = useMenuAccess(MENU.DAFTAR_JEMAAT);
  const listParams = useListParams({ filters: LIST_FILTERS });
  const jemaatList = useJemaatList(listParams);
  const zoneOptions = useZoneFilterOptions();

  return (
    <div className="pb-6">
      <PageHeader
        title="Daftar Jemaat"
        subtitle={
          jemaatList.totalData === undefined
            ? undefined
            : `${jemaatList.totalData} jemaat`
        }
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
        search={
          <SearchInput
            value={listParams.search}
            onSearch={listParams.onSearch}
            label="Cari jemaat"
            placeholder="Cari nama, kode, atau telepon"
          />
        }
        picker={
          <SelectField
            value={listParams.filters.wilayah ?? ""}
            onValueChange={(value) => listParams.onPickFilter("wilayah", value)}
            options={zoneOptions.options}
            placeholder="Semua wilayah"
            emptyMessage="Belum ada data wilayah"
            aria-label="Filter wilayah"
          />
        }
        filters={
          <FilterChips
            options={STATUS_JEMAAT_CHIPS}
            value={listParams.status}
            onPick={listParams.onPickStatus}
            label="Filter status jemaat"
          />
        }
      />

      <DataList
        items={jemaatList.items}
        getKey={(jemaat) => jemaat.code}
        label="Daftar jemaat"
        isLoading={jemaatList.isLoading}
        isRefreshing={jemaatList.isRefreshing}
        error={jemaatList.error}
        onRetry={jemaatList.onRetry}
        emptyTitle="Tidak ada jemaat"
        emptyDescription={
          listParams.search || listParams.status || listParams.filters.wilayah
            ? "Tidak ada jemaat yang cocok dengan pencarian atau filter ini."
            : "Data jemaat akan muncul di sini setelah ditambahkan."
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
