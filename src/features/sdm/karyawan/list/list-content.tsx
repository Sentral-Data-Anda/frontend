"use client";

import { useState } from "react";

import { useToast } from "@/components/common/feedback";
import {
  DataList,
  ListToolbar,
  RowDeleteDialog,
} from "@/components/common/list";
import { PageHeader, PageHeaderAdd } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useListParams } from "@/hooks/use-list-params";

import { useDeleteKaryawan, useKaryawanList } from "../api";
import {
  EMPTY_DESCRIPTION,
  EMPTY_TITLE,
  FILTERED_DESCRIPTION,
  KARYAWAN_CREATE_PATH,
} from "../model";
import type { Karyawan } from "../types";

import {
  deleteTargetLabelOf,
  KaryawanListItem,
  karyawanTable,
} from "./list-item";

export const KaryawanListContent = () => {
  const { isCanCreate, isCanUpdate, isCanDelete } = useMenuAccess(
    MENU.EMPLOYEE,
  );

  const toast = useToast();

  // Satu keadaan menyimpan baris yang akan dihapus sekaligus status terbuka
  // dialognya. Hook hapus dibuat ulang mengikuti kunci baris ini.
  const [target, setTarget] = useState<Karyawan | null>(null);
  const deleteRow = useDeleteKaryawan(target?.code);
  const listParams = useListParams();
  const karyawanList = useKaryawanList(listParams);
  const isNarrowed = Boolean(listParams.search);

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
        title="Employee"
        subtitle={
          karyawanList.totalData === undefined
            ? undefined
            : `${karyawanList.totalData} karyawan`
        }
        backHref={domainHref(MENU.HR)}
        action={
          isCanCreate ? (
            <PageHeaderAdd
              href={KARYAWAN_CREATE_PATH}
              label="Tambah karyawan"
            />
          ) : null
        }
      />

      <ListToolbar
        listParams={listParams}
        searchLabel="Cari karyawan"
        searchPlaceholder="Cari nama atau jabatan"
      />

      <DataList
        items={karyawanList.items}
        getKey={(row) => row.code}
        label="Daftar karyawan"
        isLoading={karyawanList.isLoading}
        isRefreshing={karyawanList.isRefreshing}
        error={karyawanList.error}
        onRetry={karyawanList.onRetry}
        emptyTitle={isNarrowed ? "Tidak ada karyawan" : EMPTY_TITLE}
        emptyDescription={isNarrowed ? FILTERED_DESCRIPTION : EMPTY_DESCRIPTION}
        pagination={karyawanList.pagination}
        table={karyawanTable(isCanUpdate, isCanDelete ? setTarget : undefined)}
        itemNoun="karyawan"
      >
        {(row) => <KaryawanListItem row={row} />}
      </DataList>

      <RowDeleteDialog
        target={target ? { label: deleteTargetLabelOf(target) } : null}
        entity="karyawan"
        isPending={deleteRow.isPending}
        errorMessage={deleteRow.error?.message}
        onCancel={onCancelDelete}
        onConfirm={onDelete}
      />
    </div>
  );
};
