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

import { useDeleteSatuan, useSatuanList } from "../api";
import type { Satuan } from "../types";

import {
  deleteTargetLabelOf,
  SatuanListItemRow,
  satuanTable,
} from "./list-item";

export const SatuanList = () => {
  const { isCanCreate, isCanUpdate, isCanDelete } = useMenuAccess(MENU.SATUAN);

  const toast = useToast();

  // Satu keadaan menyimpan baris yang akan dihapus sekaligus status terbuka
  // dialognya. Hook hapus dibuat ulang mengikuti kunci baris ini.
  const [target, setTarget] = useState<Satuan | null>(null);
  const deleteRow = useDeleteSatuan(target?.code);
  const listParams = useListParams();
  const satuanList = useSatuanList(listParams);
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
        title="Satuan"
        subtitle={
          satuanList.totalData === undefined
            ? undefined
            : `${satuanList.totalData} satuan`
        }
        backHref={domainHref(MENU.INVENTORY)}
        action={
          isCanCreate ? (
            <PageHeaderAdd
              href={createHref(MENU.INVENTORY, MENU.SATUAN)}
              label="Tambah satuan"
            />
          ) : null
        }
      />

      <ListToolbar
        listParams={listParams}
        searchLabel="Cari satuan"
        searchPlaceholder="Cari nama satuan"
      />

      <DataList
        loadingShape="trailing"
        items={satuanList.items}
        getKey={(satuan) => satuan.code}
        label="Daftar satuan"
        isLoading={satuanList.isLoading}
        isRefreshing={satuanList.isRefreshing}
        error={satuanList.error}
        onRetry={satuanList.onRetry}
        emptyTitle={isSearched ? "Tidak ada satuan" : "Belum ada satuan"}
        emptyDescription={
          isSearched
            ? "Tidak ada satuan yang cocok."
            : "Tambahkan satuan hitung seperti Buah, Pak, atau Rim."
        }
        pagination={satuanList.pagination}
        table={satuanTable(isCanUpdate, isCanDelete ? setTarget : undefined)}
        itemNoun="satuan"
      >
        {(satuan) => <SatuanListItemRow satuan={satuan} />}
      </DataList>

      <RowDeleteDialog
        target={target ? { label: deleteTargetLabelOf(target) } : null}
        entity="satuan"
        isPending={deleteRow.isPending}
        errorMessage={deleteRow.error?.message}
        onCancel={onCancelDelete}
        onConfirm={onDelete}
      />
    </div>
  );
};
