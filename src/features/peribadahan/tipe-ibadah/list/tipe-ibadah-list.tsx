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

import { useDeleteTipeIbadah, useTipeIbadahList } from "../api";
import { TIPE_IBADAH_STATUS_OPTIONS, type TipeIbadah } from "../types";

import {
  deleteTargetLabelOf,
  TipeIbadahListItemRow,
  tipeIbadahTable,
} from "./list-item";

export const TipeIbadahList = () => {
  const { isCanCreate, isCanUpdate, isCanDelete } = useMenuAccess(
    MENU.TIPE_IBADAH,
  );

  const toast = useToast();

  // Satu keadaan menyimpan baris yang akan dihapus sekaligus status terbuka
  // dialognya. Hook hapus dibuat ulang mengikuti kunci baris ini.
  const [target, setTarget] = useState<TipeIbadah | null>(null);
  const deleteRow = useDeleteTipeIbadah(target?.code);
  const listParams = useListParams();
  const tipeIbadahList = useTipeIbadahList(listParams);
  const isNarrowed = Boolean(listParams.search) || listParams.isFiltered;

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
        title="Tipe Ibadah"
        subtitle={
          tipeIbadahList.totalData === undefined
            ? undefined
            : `${tipeIbadahList.totalData} tipe`
        }
        backHref={domainHref(MENU.PERIBADAHAN)}
        action={
          isCanCreate ? (
            <PageHeaderAdd
              href={createHref(MENU.PERIBADAHAN, MENU.TIPE_IBADAH)}
              label="Tambah tipe ibadah"
            />
          ) : null
        }
      />

      <ListToolbar
        listParams={listParams}
        searchLabel="Cari tipe ibadah"
        searchPlaceholder="Cari nama atau kode tipe"
        filters={[
          {
            key: "status",
            label: "Status",
            kind: "choice",
            options: TIPE_IBADAH_STATUS_OPTIONS,
          },
        ]}
      />

      <DataList
        loadingShape="trailing"
        items={tipeIbadahList.items}
        getKey={(tipeIbadah) => tipeIbadah.code}
        label="Daftar tipe ibadah"
        isLoading={tipeIbadahList.isLoading}
        isRefreshing={tipeIbadahList.isRefreshing}
        error={tipeIbadahList.error}
        onRetry={tipeIbadahList.onRetry}
        emptyTitle={
          isNarrowed ? "Tidak ada tipe ibadah" : "Belum ada tipe ibadah"
        }
        emptyDescription={
          isNarrowed
            ? "Tidak ada tipe ibadah yang cocok dengan pencarian atau filter ini."
            : "Tambahkan jenis ibadah yang diadakan gereja, mis. Ibadah Minggu, Persekutuan Doa, Ibadah Pemuda."
        }
        onClearFilter={
          listParams.isFiltered ? listParams.onClearFilters : undefined
        }
        pagination={tipeIbadahList.pagination}
        table={tipeIbadahTable(
          isCanUpdate,
          isCanDelete ? setTarget : undefined,
        )}
        itemNoun="tipe ibadah"
      >
        {(tipeIbadah) => <TipeIbadahListItemRow tipeIbadah={tipeIbadah} />}
      </DataList>

      <RowDeleteDialog
        target={target ? { label: deleteTargetLabelOf(target) } : null}
        entity="tipe ibadah"
        isPending={deleteRow.isPending}
        errorMessage={deleteRow.error?.message}
        onCancel={onCancelDelete}
        onConfirm={onDelete}
      />
    </div>
  );
};
