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

import { useBapelList, useDeleteBapel } from "../api";
import type { BapelListItem } from "../types";

import { BapelListItemRow, bapelTable, deleteTargetLabelOf } from "./list-item";

export const BapelListScreen = () => {
  const { isCanCreate, isCanUpdate, isCanDelete } = useMenuAccess(MENU.BAPEL);

  const toast = useToast();

  // Satu keadaan menyimpan baris yang akan dihapus sekaligus status terbuka
  // dialognya. Hook hapus dibuat ulang mengikuti kunci baris ini.
  const [target, setTarget] = useState<BapelListItem | null>(null);
  const deleteRow = useDeleteBapel(target?.code);
  const listParams = useListParams();
  const bapelList = useBapelList(listParams);

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
        title="Badan Pelayanan"
        subtitle={
          bapelList.totalData === undefined
            ? undefined
            : `${bapelList.totalData} badan pelayanan`
        }
        backHref={domainHref(MENU.KEJEMAATAN)}
        action={
          isCanCreate ? (
            <PageHeaderAdd
              href={createHref(MENU.KEJEMAATAN, MENU.BAPEL)}
              label="Tambah badan pelayanan"
            />
          ) : null
        }
      />

      <ListToolbar
        listParams={listParams}
        searchLabel="Cari badan pelayanan"
        searchPlaceholder="Cari nama badan pelayanan"
      />

      <DataList
        loadingShape="trailing"
        items={bapelList.items}
        getKey={(bapel) => bapel.code}
        label="Daftar badan pelayanan"
        isLoading={bapelList.isLoading}
        isRefreshing={bapelList.isRefreshing}
        error={bapelList.error}
        onRetry={bapelList.onRetry}
        emptyTitle="Tidak ada badan pelayanan"
        emptyDescription={
          listParams.search
            ? "Tidak ada badan pelayanan yang cocok dengan pencarian ini."
            : "Data badan pelayanan akan muncul di sini setelah ditambahkan."
        }
        pagination={bapelList.pagination}
        table={bapelTable(isCanUpdate, isCanDelete ? setTarget : undefined)}
        itemNoun="badan pelayanan"
      >
        {(bapel) => <BapelListItemRow bapel={bapel} />}
      </DataList>

      <RowDeleteDialog
        target={target ? { label: deleteTargetLabelOf(target) } : null}
        entity="badan pelayanan"
        isPending={deleteRow.isPending}
        errorMessage={deleteRow.error?.message}
        onCancel={onCancelDelete}
        onConfirm={onDelete}
      />
    </div>
  );
};
