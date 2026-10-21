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

import { useDeleteTipeBarang, useTipeBarangList } from "../api";
import type { TipeBarang } from "../types";

import {
  deleteTargetLabelOf,
  TipeBarangListItemRow,
  tipeBarangTable,
} from "./list-item";

export const TipeBarangList = () => {
  const { isCanCreate, isCanUpdate, isCanDelete } = useMenuAccess(
    MENU.ITEM_CATEGORY,
  );

  const toast = useToast();

  // Satu keadaan menyimpan baris yang akan dihapus sekaligus status terbuka
  // dialognya. Hook hapus dibuat ulang mengikuti kunci baris ini.
  const [target, setTarget] = useState<TipeBarang | null>(null);
  const deleteRow = useDeleteTipeBarang(target?.code);
  const listParams = useListParams();
  const tipeBarangList = useTipeBarangList(listParams);
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
        title="Item Category"
        subtitle={
          tipeBarangList.totalData === undefined
            ? undefined
            : `${tipeBarangList.totalData} tipe`
        }
        backHref={domainHref(MENU.INVENTORY)}
        action={
          isCanCreate ? (
            <PageHeaderAdd
              href={createHref(MENU.INVENTORY, MENU.ITEM_CATEGORY)}
              label="Tambah tipe barang"
            />
          ) : null
        }
      />

      <ListToolbar
        listParams={listParams}
        searchLabel="Cari tipe barang"
        searchPlaceholder="Cari nama tipe"
      />

      <DataList
        loadingShape="trailing"
        items={tipeBarangList.items}
        getKey={(tipeBarang) => tipeBarang.code}
        label="Daftar tipe barang"
        isLoading={tipeBarangList.isLoading}
        isRefreshing={tipeBarangList.isRefreshing}
        error={tipeBarangList.error}
        onRetry={tipeBarangList.onRetry}
        emptyTitle={
          isSearched ? "Tidak ada tipe barang" : "Belum ada tipe barang"
        }
        emptyDescription={
          isSearched
            ? "Tidak ada tipe barang yang cocok."
            : "Tambahkan kategori seperti Elektronik, Mebel, atau ATK."
        }
        pagination={tipeBarangList.pagination}
        table={tipeBarangTable(
          isCanUpdate,
          isCanDelete ? setTarget : undefined,
        )}
        itemNoun="tipe barang"
      >
        {(tipeBarang) => <TipeBarangListItemRow tipeBarang={tipeBarang} />}
      </DataList>

      <RowDeleteDialog
        target={target ? { label: deleteTargetLabelOf(target) } : null}
        entity="tipe barang"
        isPending={deleteRow.isPending}
        errorMessage={deleteRow.error?.message}
        onCancel={onCancelDelete}
        onConfirm={onDelete}
      />
    </div>
  );
};
