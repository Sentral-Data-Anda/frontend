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

import { useDeleteMarriage, useMarriageList } from "../api";
import { MARRIAGE_STATUS_OPTIONS, type MarriageListItem } from "../types";

import {
  deleteTargetLabelOf,
  MarriageListItemRow,
  marriageTable,
} from "./list-item";

export const MarriageListScreen = () => {
  const { isCanCreate, isCanUpdate, isCanDelete } = useMenuAccess(
    MENU.PERNIKAHAN,
  );

  const toast = useToast();

  // Satu keadaan menyimpan baris yang akan dihapus sekaligus status terbuka
  // dialognya. Hook hapus dibuat ulang mengikuti kunci baris ini.
  const [target, setTarget] = useState<MarriageListItem | null>(null);
  const deleteRow = useDeleteMarriage(target?.id);
  const listParams = useListParams();
  const marriageList = useMarriageList(listParams);

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
        title="Pernikahan"
        subtitle={
          marriageList.totalData === undefined
            ? undefined
            : `${marriageList.totalData} pernikahan`
        }
        backHref={domainHref(MENU.KEJEMAATAN)}
        action={
          isCanCreate ? (
            <PageHeaderAdd
              href={createHref(MENU.KEJEMAATAN, MENU.PERNIKAHAN)}
              label="Catat pernikahan"
            />
          ) : null
        }
      />

      <ListToolbar
        listParams={listParams}
        searchLabel="Cari pernikahan"
        searchPlaceholder="Cari nama suami atau istri"
        filters={[
          {
            key: "status",
            label: "Status",
            kind: "choice",
            options: MARRIAGE_STATUS_OPTIONS,
          },
        ]}
      />

      <DataList
        loadingShape="trailing"
        items={marriageList.items}
        getKey={(marriage) => marriage.id}
        label="Daftar pernikahan"
        isLoading={marriageList.isLoading}
        isRefreshing={marriageList.isRefreshing}
        error={marriageList.error}
        onRetry={marriageList.onRetry}
        emptyTitle="Tidak ada pernikahan"
        emptyDescription={
          listParams.search || listParams.isFiltered
            ? "Tidak ada pernikahan yang cocok dengan pencarian atau filter ini."
            : "Data pernikahan akan muncul di sini setelah dicatat."
        }
        onClearFilter={
          listParams.isFiltered ? listParams.onClearFilters : undefined
        }
        pagination={marriageList.pagination}
        table={marriageTable(isCanUpdate, isCanDelete ? setTarget : undefined)}
        itemNoun="pernikahan"
      >
        {(marriage) => <MarriageListItemRow marriage={marriage} />}
      </DataList>

      <RowDeleteDialog
        target={target ? { label: deleteTargetLabelOf(target) } : null}
        entity="pernikahan"
        isPending={deleteRow.isPending}
        errorMessage={deleteRow.error?.message}
        onCancel={onCancelDelete}
        onConfirm={onDelete}
      />
    </div>
  );
};
