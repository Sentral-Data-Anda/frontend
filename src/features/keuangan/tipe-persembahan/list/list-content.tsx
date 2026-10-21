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

import { useDeleteOfferingType, useOfferingTypeList } from "../api";
import { TIPE_PERSEMBAHAN_CREATE_PATH } from "../model";
import { OFFERING_TYPE_STATUS_FILTER, type OfferingType } from "../types";

import {
  deleteTargetLabelOf,
  OfferingTypeListItemRow,
  offeringTypeTable,
} from "./list-item";

export const OfferingTypeListContent = () => {
  const { isCanCreate, isCanUpdate, isCanDelete } = useMenuAccess(
    MENU.TIPE_PERSEMBAHAN,
  );

  const toast = useToast();

  // Satu keadaan menyimpan baris yang akan dihapus sekaligus status terbuka
  // dialognya. Hook hapus dibuat ulang mengikuti kunci baris ini.
  const [target, setTarget] = useState<OfferingType | null>(null);
  const deleteRow = useDeleteOfferingType(target?.code);
  const listParams = useListParams();
  const offeringTypeList = useOfferingTypeList(listParams);
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
        title="Tipe Persembahan"
        subtitle={
          offeringTypeList.totalData === undefined
            ? undefined
            : `${offeringTypeList.totalData} tipe`
        }
        backHref={domainHref(MENU.FINANCE)}
        action={
          isCanCreate ? (
            <PageHeaderAdd
              href={TIPE_PERSEMBAHAN_CREATE_PATH}
              label="Tambah tipe persembahan"
            />
          ) : null
        }
      />

      <ListToolbar
        listParams={listParams}
        searchLabel="Cari tipe persembahan"
        searchPlaceholder="Cari nama tipe"
        filters={[
          {
            key: "status",
            label: "Status",
            kind: "choice",
            options: OFFERING_TYPE_STATUS_FILTER,
          },
        ]}
      />

      <DataList
        loadingShape="trailing"
        items={offeringTypeList.items}
        getKey={(offeringType) => offeringType.code}
        label="Daftar tipe persembahan"
        isLoading={offeringTypeList.isLoading}
        isRefreshing={offeringTypeList.isRefreshing}
        error={offeringTypeList.error}
        onRetry={offeringTypeList.onRetry}
        emptyTitle={
          isNarrowed
            ? "Tidak ada tipe persembahan"
            : "Belum ada tipe persembahan"
        }
        emptyDescription={
          isNarrowed
            ? "Tidak ada tipe persembahan yang cocok dengan filter ini."
            : "Tambahkan jenis persembahan yang dicatat gereja, mis. Kolekte atau Perpuluhan. Tiap tipe menunjuk akun pendapatannya sendiri."
        }
        onClearFilter={
          listParams.isFiltered ? listParams.onClearFilters : undefined
        }
        pagination={offeringTypeList.pagination}
        table={offeringTypeTable(
          isCanUpdate,
          isCanDelete ? setTarget : undefined,
        )}
        itemNoun="tipe"
      >
        {(offeringType) => (
          <OfferingTypeListItemRow offeringType={offeringType} />
        )}
      </DataList>

      <RowDeleteDialog
        target={target ? { label: deleteTargetLabelOf(target) } : null}
        entity="tipe"
        isPending={deleteRow.isPending}
        errorMessage={deleteRow.error?.message}
        onCancel={onCancelDelete}
        onConfirm={onDelete}
      />
    </div>
  );
};
