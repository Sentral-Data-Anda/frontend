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

import { useDeleteKeluarga, useKeluargaList } from "../api";
import type { Keluarga } from "../types";

import {
  deleteTargetLabelOf,
  KeluargaListItemRow,
  keluargaTable,
} from "./list-item";

export const KeluargaListScreen = () => {
  const { isCanCreate, isCanUpdate, isCanDelete } = useMenuAccess(
    MENU.KELUARGA,
  );

  const toast = useToast();

  // Satu keadaan menyimpan baris yang akan dihapus sekaligus status terbuka
  // dialognya. Hook hapus dibuat ulang mengikuti kunci baris ini.
  const [target, setTarget] = useState<Keluarga | null>(null);
  const deleteRow = useDeleteKeluarga(target?.code);
  const listParams = useListParams();
  const keluargaList = useKeluargaList(listParams);

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
        title="Keluarga"
        subtitle={
          keluargaList.totalData === undefined
            ? undefined
            : `${keluargaList.totalData} keluarga`
        }
        backHref={domainHref(MENU.KEJEMAATAN)}
        action={
          isCanCreate ? (
            <PageHeaderAdd
              href={createHref(MENU.KEJEMAATAN, MENU.KELUARGA)}
              label="Tambah keluarga"
            />
          ) : null
        }
      />

      <ListToolbar
        listParams={listParams}
        searchLabel="Cari keluarga"
        searchPlaceholder="Cari nama atau kode keluarga"
      />

      <DataList
        loadingShape="trailing"
        items={keluargaList.items}
        getKey={(keluarga) => keluarga.code}
        label="Daftar keluarga"
        isLoading={keluargaList.isLoading}
        isRefreshing={keluargaList.isRefreshing}
        error={keluargaList.error}
        onRetry={keluargaList.onRetry}
        emptyTitle="Tidak ada keluarga"
        emptyDescription={
          listParams.search
            ? "Tidak ada keluarga yang cocok dengan pencarian ini."
            : "Data keluarga akan muncul di sini setelah ditambahkan."
        }
        pagination={keluargaList.pagination}
        table={keluargaTable(isCanUpdate, isCanDelete ? setTarget : undefined)}
        itemNoun="keluarga"
      >
        {(keluarga) => <KeluargaListItemRow keluarga={keluarga} />}
      </DataList>

      <RowDeleteDialog
        target={target ? { label: deleteTargetLabelOf(target) } : null}
        entity="keluarga"
        isPending={deleteRow.isPending}
        errorMessage={deleteRow.error?.message}
        onCancel={onCancelDelete}
        onConfirm={onDelete}
      />
    </div>
  );
};
