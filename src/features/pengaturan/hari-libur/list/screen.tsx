"use client";

import { optionsOf } from "@/components/common/control";
import { DataList, ListToolbar } from "@/components/common/list";
import { PageHeader, PageHeaderAdd } from "@/components/layout";
import { MENU, createHref, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useListParams, type ListFilterSchema } from "@/hooks/use-list-params";

import { useHolidayList } from "../api";
import { yearOptions } from "../model";
import { HOLIDAY_TYPE_LABEL } from "../types";

import { HolidayListItemRow, holidayTable } from "./list-item";

const LIST_FILTERS = {
  tahun: { api: "year" },
  tipe: { api: "type" },
} satisfies ListFilterSchema;

const YEAR_OPTIONS = yearOptions();

const TYPE_FILTER_OPTIONS = [
  { value: "", label: "Semua" },
  ...optionsOf(HOLIDAY_TYPE_LABEL),
];

export const HolidayListScreen = () => {
  const { isCanCreate, isCanUpdate } = useMenuAccess(MENU.HOLIDAY);
  const listParams = useListParams({ filters: LIST_FILTERS });
  const holidayList = useHolidayList(listParams);

  return (
    <div className="pb-6">
      <PageHeader
        title="Hari Libur"
        subtitle={
          holidayList.totalData === undefined
            ? undefined
            : `${holidayList.totalData} hari libur`
        }
        backHref={domainHref(MENU.SETTINGS)}
        action={
          isCanCreate ? (
            <PageHeaderAdd
              href={createHref(MENU.SETTINGS, MENU.HOLIDAY)}
              label="Tambah hari libur"
            />
          ) : null
        }
      />

      <ListToolbar
        listParams={listParams}
        searchLabel="Cari hari libur"
        searchPlaceholder="Cari nama hari libur"
        filters={[
          {
            key: "tahun",
            label: "Tahun",
            kind: "select",
            options: YEAR_OPTIONS,
            chipLabel: (year) => `Tahun ${year}`,
          },
          {
            key: "tipe",
            label: "Tipe",
            kind: "choice",
            options: TYPE_FILTER_OPTIONS,
          },
        ]}
      />

      <DataList
        loadingShape="trailing"
        items={holidayList.items}
        getKey={(holiday) => String(holiday.id)}
        label="Daftar hari libur"
        isLoading={holidayList.isLoading}
        isRefreshing={holidayList.isRefreshing}
        error={holidayList.error}
        onRetry={holidayList.onRetry}
        emptyTitle="Tidak ada hari libur"
        emptyDescription={
          listParams.search || listParams.isFiltered
            ? "Tidak ada hari libur yang cocok dengan pencarian atau filter ini."
            : "Libur nasional, cuti bersama, dan hari khusus gereja akan muncul di sini setelah ditambahkan."
        }
        onClearFilter={
          listParams.isFiltered ? listParams.onClearFilters : undefined
        }
        pagination={holidayList.pagination}
        table={holidayTable(isCanUpdate)}
        itemNoun="hari libur"
      >
        {(holiday) => (
          <HolidayListItemRow holiday={holiday} isCanUpdate={isCanUpdate} />
        )}
      </DataList>
    </div>
  );
};
