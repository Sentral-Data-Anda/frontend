"use client";

import { useState } from "react";

import { EmptyState, useToast } from "@/components/common/feedback";
import {
  DataList,
  ListToolbar,
  RowDeleteDialog,
} from "@/components/common/list";
import { PageHeader, PageHeaderAdd } from "@/components/layout";
import { MENU, createHref, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useListParams } from "@/hooks/use-list-params";

import { useDeleteWilayah, useWilayahList } from "../api";
import { WILAYAH_STATUS_OPTIONS, type Wilayah } from "../types";

import { WilayahListItemRow, wilayahTable } from "./list-item";

export const WilayahListScreen = () => {
  const { isCanView, isCanCreate, isCanUpdate, isCanDelete } = useMenuAccess(
    MENU.WILAYAH,
  );
  const listParams = useListParams();
  const wilayahList = useWilayahList(listParams, isCanView);
  const toast = useToast();

  // Satu keadaan menyimpan baris yang akan dihapus sekaligus status terbuka
  // dialognya. Hook hapus dibuat ulang mengikuti kode baris ini.
  const [target, setTarget] = useState<Wilayah | null>(null);
  const deleteWilayah = useDeleteWilayah(target?.code);

  const onDelete = () => {
    deleteWilayah.mutate(undefined, {
      onSuccess: (deleted) => {
        toast.add({ title: deleted.message });
        setTarget(null);
      },
    });
  };

  const onCancelDelete = () => {
    deleteWilayah.reset();
    setTarget(null);
  };

  if (!isCanView) {
    return (
      <div className="pb-6">
        <PageHeader title="Wilayah" backHref={domainHref(MENU.KEJEMAATAN)} />

        <EmptyState
          title="Anda tidak memiliki akses ke Wilayah"
          description="Hubungi administrator bila Anda memerlukan akses ini."
        />
      </div>
    );
  }

  return (
    <div className="pb-6">
      <PageHeader
        title="Wilayah"
        subtitle={
          wilayahList.totalData === undefined
            ? undefined
            : `${wilayahList.totalData} wilayah`
        }
        backHref={domainHref(MENU.KEJEMAATAN)}
        action={
          isCanCreate ? (
            <PageHeaderAdd
              href={createHref(MENU.KEJEMAATAN, MENU.WILAYAH)}
              label="Tambah wilayah"
            />
          ) : null
        }
      />

      <ListToolbar
        listParams={listParams}
        searchLabel="Cari wilayah"
        searchPlaceholder="Cari nama atau kode wilayah"
        filters={[
          {
            key: "status",
            label: "Status",
            kind: "choice",
            options: WILAYAH_STATUS_OPTIONS,
          },
        ]}
      />

      <DataList
        loadingShape="trailing"
        items={wilayahList.items}
        getKey={(wilayah) => wilayah.code}
        label="Daftar wilayah"
        isLoading={wilayahList.isLoading}
        isRefreshing={wilayahList.isRefreshing}
        error={wilayahList.error}
        onRetry={wilayahList.onRetry}
        emptyTitle="Tidak ada wilayah"
        emptyDescription={
          listParams.search || listParams.isFiltered
            ? "Tidak ada wilayah yang cocok dengan pencarian atau filter ini."
            : "Data wilayah akan muncul di sini setelah ditambahkan."
        }
        onClearFilter={
          listParams.isFiltered ? listParams.onClearFilters : undefined
        }
        pagination={wilayahList.pagination}
        table={wilayahTable(isCanUpdate, isCanDelete ? setTarget : undefined)}
        itemNoun="wilayah"
      >
        {(wilayah) => <WilayahListItemRow wilayah={wilayah} />}
      </DataList>

      <RowDeleteDialog
        target={target ? { label: target.name } : null}
        entity="wilayah"
        isPending={deleteWilayah.isPending}
        errorMessage={deleteWilayah.error?.message}
        onCancel={onCancelDelete}
        onConfirm={onDelete}
      />
    </div>
  );
};
