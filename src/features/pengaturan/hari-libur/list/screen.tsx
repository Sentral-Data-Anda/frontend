"use client";

import { useState } from "react";

import { optionsOf } from "@/components/common/control";
import { useToast } from "@/components/common/feedback";
import {
  DataList,
  ListToolbar,
  RowDeleteDialog,
} from "@/components/common/list";
import { PageHeader, PageHeaderAdd } from "@/components/layout";
import { MENU, createHref, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useListParams, type ListFilterSchema } from "@/hooks/use-list-params";

import { useDeleteHoliday, useHolidayList } from "../api";
import { yearOptions } from "../model";
import { HOLIDAY_TYPE_LABEL, type HolidayRow } from "../types";

import {
  deleteTargetLabelOf,
  HolidayListItemRow,
  holidayTable,
} from "./list-item";

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
  const { isCanCreate, isCanUpdate, isCanDelete } = useMenuAccess(MENU.HOLIDAY);

  const toast = useToast();

  // Satu keadaan menyimpan baris yang akan dihapus sekaligus status terbuka
  // dialognya. Hook hapus dibuat ulang mengikuti kunci baris ini.
  const [target, setTarget] = useState<HolidayRow | null>(null);
  const deleteRow = useDeleteHoliday(target?.publicId);
  const listParams = useListParams({ filters: LIST_FILTERS });
  const holidayList = useHolidayList(listParams);

  const onDelete = () => {
    deleteRow.mutate(undefined, {
      onSuccess: (deleted) => {
        toast.add({ title: deleted.message });
        setTarget(null);
      },
    });
  };

  const onCancelDelete = () => {
    deleteRow.reset();
    setTarget(null);
  };

  return (
    <div className="pb-6">
      <PageHeader
        title="Holiday"
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
        table={holidayTable(isCanUpdate, isCanDelete ? setTarget : undefined)}
        itemNoun="hari libur"
      >
        {(holiday) => <HolidayListItemRow holiday={holiday} />}
      </DataList>

      <RowDeleteDialog
        target={target ? { label: deleteTargetLabelOf(target) } : null}
        entity="hari libur"
        isPending={deleteRow.isPending}
        errorMessage={deleteRow.error?.message}
        onCancel={onCancelDelete}
        onConfirm={onDelete}
      />
    </div>
  );
};
