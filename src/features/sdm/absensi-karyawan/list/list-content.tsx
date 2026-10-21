"use client";

import { useState } from "react";

import { useToast } from "@/components/common/feedback";
import {
  DataList,
  ListToolbar,
  RowDeleteDialog,
} from "@/components/common/list";
import { PageHeader, PageHeaderAdd } from "@/components/layout";
import { MENU, createHref, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useDdlOptions } from "@/hooks/use-ddl-options";
import { useListParams } from "@/hooks/use-list-params";

import { ABSENSI_FILTERS, useAbsensiList, useDeleteAbsensi } from "../api";
import {
  EMPTY_DESCRIPTION,
  MONTH_ALL,
  PAYROLL_NOTE,
  TITLE,
  monthFilterOptions,
  subtitleOf,
} from "../model";
import {
  type AbsensiKaryawan,
  ATTENDANCE_STATUS_LABEL,
  ATTENDANCE_STATUSES,
} from "../types";

import {
  AbsensiListItemRow,
  absensiTable,
  deleteTargetLabelOf,
} from "./list-item";

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
  const { isCanCreate, isCanUpdate, isCanDelete } = useMenuAccess(
    MENU.ATTENDANCE,
  );

  const toast = useToast();

  // Satu keadaan menyimpan baris yang akan dihapus sekaligus status terbuka
  // dialognya. Hook hapus dibuat ulang mengikuti kunci baris ini.
  const [target, setTarget] = useState<AbsensiKaryawan | null>(null);
  const deleteRow = useDeleteAbsensi(target?.publicId);
  const listParams = useListParams({ filters: ABSENSI_FILTERS });
  const absensiList = useAbsensiList(listParams);
  const karyawan = useDdlOptions("karyawan", "id");

  // Daftar ini selalu dibatasi bulan kecuali "Semua bulan" dipilih, jadi
  // "belum ada data" hanya benar ketika tidak ada satu pun batas yang berlaku —
  // dan sesudah `bulan` menyatakan bawaannya, `isFiltered` sudah berarti itu.
  const isAllMonths = listParams.filters.bulan === MONTH_ALL;
  const isNarrowed = listParams.isFiltered;

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
        title={TITLE}
        subtitle={subtitleOf(absensiList.totalData, listParams.filters)}
        backHref={domainHref(MENU.HR)}
        action={
          isCanCreate ? (
            <PageHeaderAdd
              href={createHref(MENU.HR, MENU.ATTENDANCE)}
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
        table={absensiTable(isCanUpdate, isCanDelete ? setTarget : undefined)}
        itemNoun="catatan absensi"
      >
        {(row) => <AbsensiListItemRow absensi={row} />}
      </DataList>

      <RowDeleteDialog
        target={target ? { label: deleteTargetLabelOf(target) } : null}
        entity="catatan absensi"
        isPending={deleteRow.isPending}
        errorMessage={deleteRow.error?.message}
        onCancel={onCancelDelete}
        onConfirm={onDelete}
      />
    </div>
  );
};
