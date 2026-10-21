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
import { useDdlOptions } from "@/hooks/use-ddl-options";
import { useListParams, type ListFilterSchema } from "@/hooks/use-list-params";

import { useDeleteJadwalPelayan, useJadwalPelayanList } from "../api";
import { JADWAL_PELAYAN_CREATE_PATH, monthOptions } from "../model";
import type { JadwalPelayan } from "../types";

import {
  deleteTargetLabelOf,
  JadwalPelayanListItemRow,
  jadwalPelayanTable,
} from "./list-item";

const LIST_FILTERS = {
  bulan: { api: "month" },
  bapel: { api: "bapelId" },
} satisfies ListFilterSchema;

export const JadwalPelayanListContent = () => {
  const { isCanCreate, isCanUpdate, isCanDelete } = useMenuAccess(
    MENU.JADWAL_PELAYAN,
  );

  const toast = useToast();

  // Satu keadaan menyimpan baris yang akan dihapus sekaligus status terbuka
  // dialognya. Hook hapus dibuat ulang mengikuti kunci baris ini.
  const [target, setTarget] = useState<JadwalPelayan | null>(null);
  const deleteRow = useDeleteJadwalPelayan(target?.code);
  const listParams = useListParams({ filters: LIST_FILTERS });
  const jadwalList = useJadwalPelayanList(listParams);
  const bapel = useDdlOptions("bapel", "id", listParams.filters.bapel);
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
        title="Jadwal Pelayan"
        subtitle={
          jadwalList.totalData === undefined
            ? undefined
            : `${jadwalList.totalData} jadwal`
        }
        backHref={domainHref(MENU.PELAYANAN)}
        action={
          isCanCreate ? (
            <PageHeaderAdd
              href={JADWAL_PELAYAN_CREATE_PATH}
              label="Tambah jadwal pelayan"
            />
          ) : null
        }
      />

      <ListToolbar
        listParams={listParams}
        searchLabel="Cari jadwal pelayan"
        searchPlaceholder="Cari nama atau kode jadwal"
        filters={[
          {
            key: "bulan",
            label: "Bulan",
            kind: "select",
            options: [{ value: "", label: "Semua bulan" }, ...monthOptions()],
          },
          {
            key: "bapel",
            label: "Badan pelayanan",
            kind: "select",
            options: [
              { value: "", label: "Semua badan pelayanan" },
              ...bapel.options,
            ],
          },
        ]}
      />

      <DataList
        loadingShape="trailing"
        items={jadwalList.items}
        getKey={(jadwal) => jadwal.code}
        label="Daftar jadwal pelayan"
        isLoading={jadwalList.isLoading}
        isRefreshing={jadwalList.isRefreshing}
        error={jadwalList.error}
        onRetry={jadwalList.onRetry}
        emptyTitle={
          isNarrowed ? "Tidak ada jadwal" : "Belum ada jadwal pelayan"
        }
        emptyDescription={
          isNarrowed
            ? "Tidak ada jadwal yang cocok dengan pencarian atau filter ini."
            : "Atur siapa melayani di tiap ibadah. Mulai dari template supaya susunan tugas langsung terisi."
        }
        onClearFilter={
          listParams.isFiltered ? listParams.onClearFilters : undefined
        }
        pagination={jadwalList.pagination}
        table={jadwalPelayanTable(
          isCanUpdate,
          isCanDelete ? setTarget : undefined,
        )}
        itemNoun="jadwal"
      >
        {(jadwal) => <JadwalPelayanListItemRow jadwal={jadwal} />}
      </DataList>

      <RowDeleteDialog
        target={target ? { label: deleteTargetLabelOf(target) } : null}
        entity="jadwal"
        isPending={deleteRow.isPending}
        errorMessage={deleteRow.error?.message}
        onCancel={onCancelDelete}
        onConfirm={onDelete}
      />
    </div>
  );
};
