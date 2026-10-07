"use client";

import { DataList, ListToolbar } from "@/components/common/list";
import { PageHeader, PageHeaderAdd } from "@/components/layout";
import { MENU, createHref, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useDdlOptions } from "@/hooks/use-ddl-options";
import { useListParams } from "@/hooks/use-list-params";

import { ABSENSI_FILTERS, useAbsensiList } from "../api";
import {
  EMPTY_DESCRIPTION,
  MONTH_ALL,
  PAYROLL_NOTE,
  TITLE,
  monthFilterOptions,
  subtitleOf,
} from "../model";
import { ATTENDANCE_STATUS_LABEL, ATTENDANCE_STATUSES } from "../types";

import { AbsensiListItemRow, absensiTable } from "./list-item";

const MONTH_DESCRIPTION =
  "Tidak ada catatan absensi pada bulan yang dipilih. Pilih Semua bulan untuk melihat seluruh catatan.";

const FILTER_DESCRIPTION =
  "Tidak ada catatan absensi yang cocok dengan filter.";

const STATUS_OPTIONS = [
  { value: "", label: "Semua status" },
  ...ATTENDANCE_STATUSES.map((status) => ({
    value: status,
    label: ATTENDANCE_STATUS_LABEL[status],
  })),
];

export const AbsensiListContent = () => {
  const { isCanCreate, isCanUpdate } = useMenuAccess(MENU.ABSENSI_KARYAWAN);
  const listParams = useListParams({ filters: ABSENSI_FILTERS });
  const absensiList = useAbsensiList(listParams);
  const karyawan = useDdlOptions("karyawan", "id");

  // Daftar ini selalu dibatasi bulan kecuali "Semua bulan" dipilih, jadi
  // "belum ada data" hanya benar ketika tidak ada satu pun batas yang berlaku —
  // dan sesudah `bulan` menyatakan bawaannya, `isFiltered` sudah berarti itu.
  const isAllMonths = listParams.filters.bulan === MONTH_ALL;
  const isNarrowed = listParams.isFiltered;

  return (
    <div className="pb-6">
      <PageHeader
        title={TITLE}
        subtitle={subtitleOf(absensiList.totalData, listParams.filters)}
        backHref={domainHref(MENU.SDM)}
        action={
          isCanCreate ? (
            <PageHeaderAdd
              href={createHref(MENU.SDM, MENU.ABSENSI_KARYAWAN)}
              label="Tambah absensi karyawan"
            />
          ) : null
        }
      />

      {/* Menetap, bukan hanya di keadaan kosong: yang mengisi layar ini setiap
          hari membacanya di sini, bukan di form (U-F). */}
      <p className="text-muted-foreground px-gutter pb-4 text-caption">
        {PAYROLL_NOTE}
      </p>

      {/* Tanpa kotak cari: `GET /absensi-karyawan` be-sada belum menerima
          `?filter`, dan kotak yang tidak menyaring apa pun adalah janji kosong. */}
      <ListToolbar
        listParams={listParams}
        filters={[
          {
            key: "bulan",
            label: "Bulan",
            kind: "select",
            options: monthFilterOptions(),
            defaultValue: MONTH_ALL,
          },
          {
            key: "karyawan",
            label: "Karyawan",
            kind: "select",
            options: [
              { value: "", label: "Semua karyawan" },
              ...karyawan.options,
            ],
            emptyMessage: "Belum ada karyawan aktif",
          },
          {
            key: "status",
            label: "Status",
            kind: "select",
            options: STATUS_OPTIONS,
          },
        ]}
      />

      <DataList
        loadingShape="trailing"
        items={absensiList.items}
        getKey={(row) => row.publicId}
        label="Daftar absensi karyawan"
        isLoading={absensiList.isLoading}
        isRefreshing={absensiList.isRefreshing}
        error={absensiList.error}
        onRetry={absensiList.onRetry}
        onClearFilter={
          listParams.isFiltered ? listParams.onClearFilters : undefined
        }
        emptyTitle={
          isNarrowed
            ? "Tidak ada absensi karyawan"
            : "Belum ada absensi karyawan"
        }
        emptyDescription={
          !isNarrowed
            ? EMPTY_DESCRIPTION
            : isAllMonths
              ? FILTER_DESCRIPTION
              : MONTH_DESCRIPTION
        }
        pagination={absensiList.pagination}
        table={absensiTable(isCanUpdate)}
        itemNoun="catatan absensi"
      >
        {(row) => (
          <AbsensiListItemRow absensi={row} isCanUpdate={isCanUpdate} />
        )}
      </DataList>
    </div>
  );
};
