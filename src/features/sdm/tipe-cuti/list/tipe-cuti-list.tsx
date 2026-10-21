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
import { useListParams } from "@/hooks/use-list-params";

import { useDeleteTipeCuti, useTipeCutiList } from "../api";
import type { TipeCuti } from "../types";

import {
  deleteTargetLabelOf,
  TipeCutiListItemRow,
  tipeCutiTable,
} from "./list-item";

// Nol tipe di-seed: ini keadaan hari pertama. Kalimat, bukan tombol penyemai.
const EMPTY_DESCRIPTION =
  "Gereja yang menentukan jenis cutinya sendiri. Yang lazim dipakai: cuti tahunan, sakit, melahirkan, menikah, dan duka — tambahkan yang berlaku di sini beserta jatah harinya.";

export const TipeCutiList = () => {
  const { isCanCreate, isCanUpdate, isCanDelete } = useMenuAccess(
    MENU.LEAVE_TYPE,
  );

  const toast = useToast();

  // Satu keadaan menyimpan baris yang akan dihapus sekaligus status terbuka
  // dialognya. Hook hapus dibuat ulang mengikuti kunci baris ini.
  const [target, setTarget] = useState<TipeCuti | null>(null);
  const deleteRow = useDeleteTipeCuti(target?.code);
  const listParams = useListParams();
  const tipeCutiList = useTipeCutiList(listParams);
  const isSearched = Boolean(listParams.search);

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
        title="Leave Type"
        subtitle={
          tipeCutiList.totalData === undefined
            ? undefined
            : `${tipeCutiList.totalData} tipe cuti`
        }
        backHref={domainHref(MENU.HR)}
        action={
          isCanCreate ? (
            <PageHeaderAdd
              href={createHref(MENU.HR, MENU.LEAVE_TYPE)}
              label="Tambah tipe cuti"
            />
          ) : null
        }
      />

      <ListToolbar
        listParams={listParams}
        searchLabel="Cari tipe cuti"
        searchPlaceholder="Cari nama tipe cuti"
      />

      <DataList
        loadingShape="trailing"
        items={tipeCutiList.items}
        getKey={(row) => row.code}
        label="Daftar tipe cuti"
        isLoading={tipeCutiList.isLoading}
        isRefreshing={tipeCutiList.isRefreshing}
        error={tipeCutiList.error}
        onRetry={tipeCutiList.onRetry}
        emptyTitle={isSearched ? "Tidak ada tipe cuti" : "Belum ada tipe cuti"}
        emptyDescription={
          isSearched
            ? "Tidak ada tipe cuti yang cocok dengan pencarian."
            : EMPTY_DESCRIPTION
        }
        pagination={tipeCutiList.pagination}
        table={tipeCutiTable(isCanUpdate, isCanDelete ? setTarget : undefined)}
        itemNoun="tipe cuti"
      >
        {(row) => <TipeCutiListItemRow tipeCuti={row} />}
      </DataList>

      <RowDeleteDialog
        target={target ? { label: deleteTargetLabelOf(target) } : null}
        entity="tipe cuti"
        isPending={deleteRow.isPending}
        errorMessage={deleteRow.error?.message}
        onCancel={onCancelDelete}
        onConfirm={onDelete}
      />
    </div>
  );
};
