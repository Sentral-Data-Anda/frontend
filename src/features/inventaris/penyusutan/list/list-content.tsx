"use client";

import { DataList, ListToolbar } from "@/components/common/list";
import { PageHeader, PageHeaderAdd } from "@/components/layout";
import { MENU, createHref, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useListParams, type ListFilterSchema } from "@/hooks/use-list-params";

import { useRunList } from "../api";
import { STATUS_FILTER_OPTIONS, yearOptions } from "../model";

import { GapNote } from "./gap-note";
import { PenyusutanListItemRow, penyusutanTable } from "./list-item";

const LIST_FILTERS = { tahun: { api: "year" } } satisfies ListFilterSchema;

const YEAR_OPTIONS = yearOptions();

export const PenyusutanListContent = () => {
  const { isCanCreate } = useMenuAccess(MENU.DEPRECIATION);
  const listParams = useListParams({ filters: LIST_FILTERS });
  const runList = useRunList(listParams);

  return (
    <div className="pb-6">
      <PageHeader
        title="Depreciation"
        subtitle={
          runList.totalData === undefined
            ? undefined
            : `${runList.totalData} periode`
        }
        backHref={domainHref(MENU.FIXED_ASSET)}
        action={
          isCanCreate ? (
            <PageHeaderAdd
              href={createHref(MENU.FIXED_ASSET, MENU.DEPRECIATION)}
              label="Buka periode"
              text="Buka periode"
            />
          ) : null
        }
      />

      <GapNote />

      <ListToolbar
        listParams={listParams}
        filters={[
          {
            key: "tahun",
            label: "Tahun",
            kind: "select",
            options: YEAR_OPTIONS,
            chipLabel: (year) => `Tahun ${year}`,
          },
          {
            key: "status",
            label: "Status",
            kind: "choice",
            options: STATUS_FILTER_OPTIONS,
          },
        ]}
      />

      <DataList
        loadingShape="trailing"
        items={runList.items}
        getKey={(run) => run.code}
        label="Daftar penyusutan"
        isLoading={runList.isLoading}
        isRefreshing={runList.isRefreshing}
        error={runList.error}
        onRetry={runList.onRetry}
        emptyTitle={
          listParams.isFiltered
            ? "Tidak ada penyusutan"
            : "Belum ada penyusutan"
        }
        emptyDescription={
          listParams.isFiltered
            ? "Tidak ada periode penyusutan yang cocok dengan filter ini."
            : "Buka periode bulan ini untuk menghitung penyusutan barang."
        }
        onClearFilter={
          listParams.isFiltered ? listParams.onClearFilters : undefined
        }
        pagination={runList.pagination}
        table={penyusutanTable()}
        itemNoun="periode"
      >
        {(run) => <PenyusutanListItemRow run={run} />}
      </DataList>
    </div>
  );
};
