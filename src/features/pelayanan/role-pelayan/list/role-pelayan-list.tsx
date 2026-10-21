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

import { useDeleteRolePelayan, useRolePelayanList } from "../api";
import type { RolePelayan } from "../types";

import {
  deleteTargetLabelOf,
  RolePelayanListItemRow,
  rolePelayanTable,
} from "./list-item";

export const RolePelayanList = () => {
  const { isCanCreate, isCanUpdate, isCanDelete } = useMenuAccess(
    MENU.ROLE_PELAYAN,
  );

  const toast = useToast();

  // Satu keadaan menyimpan baris yang akan dihapus sekaligus status terbuka
  // dialognya. Hook hapus dibuat ulang mengikuti kunci baris ini.
  const [target, setTarget] = useState<RolePelayan | null>(null);
  const deleteRow = useDeleteRolePelayan(target?.publicId);
  const listParams = useListParams();
  const rolePelayanList = useRolePelayanList(listParams);
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
        title="Role Pelayan"
        subtitle={
          rolePelayanList.totalData === undefined
            ? undefined
            : `${rolePelayanList.totalData} tugas`
        }
        backHref={domainHref(MENU.PELAYANAN)}
        action={
          isCanCreate ? (
            <PageHeaderAdd
              href={createHref(MENU.PELAYANAN, MENU.ROLE_PELAYAN)}
              label="Tambah role pelayan"
            />
          ) : null
        }
      />

      <ListToolbar
        listParams={listParams}
        searchLabel="Cari role pelayan"
        searchPlaceholder="Cari nama tugas"
      />

      <DataList
        loadingShape="trailing"
        items={rolePelayanList.items}
        getKey={(rolePelayan) => String(rolePelayan.id)}
        label="Daftar role pelayan"
        isLoading={rolePelayanList.isLoading}
        isRefreshing={rolePelayanList.isRefreshing}
        error={rolePelayanList.error}
        onRetry={rolePelayanList.onRetry}
        emptyTitle={
          isSearched ? "Tidak ada role pelayan" : "Belum ada role pelayan"
        }
        emptyDescription={
          isSearched
            ? "Tidak ada role pelayan yang cocok dengan pencarian ini."
            : "Tambahkan jenis tugas dalam ibadah, mis. Liturgis, Pemusik, Multimedia, Penerima Tamu."
        }
        pagination={rolePelayanList.pagination}
        table={rolePelayanTable(
          isCanUpdate,
          isCanDelete ? setTarget : undefined,
        )}
        itemNoun="role pelayan"
      >
        {(rolePelayan) => <RolePelayanListItemRow rolePelayan={rolePelayan} />}
      </DataList>

      <RowDeleteDialog
        target={target ? { label: deleteTargetLabelOf(target) } : null}
        entity="role pelayan"
        isPending={deleteRow.isPending}
        errorMessage={deleteRow.error?.message}
        onCancel={onCancelDelete}
        onConfirm={onDelete}
      />
    </div>
  );
};
