"use client";

import { useState } from "react";

import { optionsOf } from "@/components/common/control";
import { useToast } from "@/components/common/feedback";
import {
  DataList,
  ListToolbar,
  RowDeleteDialog,
} from "@/components/common/list";
import { MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useListParams, type ListFilterSchema } from "@/hooks/use-list-params";

import { useDeleteMaintenance, useMaintenanceList } from "../api";
import { MAINTENANCE_STATUS_LABEL } from "../model";
import type { Maintenance } from "../types";

import { ListHeader } from "./list-header";
import { EMPTY_FILTERED, MONTH_FILTER, SEARCH } from "./list-options";
import {
  deleteTargetLabelOf,
  MaintenanceItem,
  maintenanceTable,
} from "./maintenance-item";

const LIST_FILTERS = { bulan: { api: "bulan" } } satisfies ListFilterSchema;

const STATUS_OPTIONS = [
  { value: "", label: "Semua status" },
  ...optionsOf(MAINTENANCE_STATUS_LABEL),
];

export const MaintenanceContent = () => {
  const { isCanUpdate, isCanDelete } = useMenuAccess(MENU.ASSET_TRANSACTION);

  const toast = useToast();

  // Satu keadaan menyimpan baris yang akan dihapus sekaligus status terbuka
  // dialognya. Hook hapus dibuat ulang mengikuti kunci baris ini.
  const [target, setTarget] = useState<Maintenance | null>(null);
  const deleteRow = useDeleteMaintenance(target?.code);
  const listParams = useListParams({ filters: LIST_FILTERS });
  const list = useMaintenanceList(listParams);
  const isFiltered = Boolean(listParams.search) || listParams.isFiltered;

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
      <ListHeader
        kind="perawatan"
        totalData={list.totalData}
        listParams={listParams}
      />

      <ListToolbar
        listParams={listParams}
        {...SEARCH}
        filters={[
          MONTH_FILTER,
          {
            key: "status",
            label: "Status",
            kind: "choice",
            options: STATUS_OPTIONS,
          },
        ]}
      />

      <DataList
        loadingShape="trailing"
        items={list.items}
        getKey={(row) => row.code}
        label="Daftar perawatan"
        isLoading={list.isLoading}
        isRefreshing={list.isRefreshing}
        error={list.error}
        onRetry={list.onRetry}
        emptyTitle={isFiltered ? EMPTY_FILTERED.title : "Belum ada perawatan"}
        emptyDescription={
          isFiltered
            ? EMPTY_FILTERED.description
            : "Catat servis dan perbaikan barang di sini."
        }
        onClearFilter={
          listParams.isFiltered ? listParams.onClearFilters : undefined
        }
        pagination={list.pagination}
        table={maintenanceTable(
          isCanUpdate,
          isCanDelete ? setTarget : undefined,
        )}
        itemNoun="perawatan"
      >
        {(row) => <MaintenanceItem row={row} />}
      </DataList>

      <RowDeleteDialog
        target={target ? { label: deleteTargetLabelOf(target) } : null}
        entity="perawatan"
        isPending={deleteRow.isPending}
        errorMessage={deleteRow.error?.message}
        onCancel={onCancelDelete}
        onConfirm={onDelete}
      />
    </div>
  );
};
