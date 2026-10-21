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
import { useDdlOptions } from "@/hooks/use-ddl-options";
import { useListParams, type ListFilterSchema } from "@/hooks/use-list-params";

import { useDeletePengumuman, usePengumumanList } from "../api";
import { CATEGORY_OPTIONS, STATUS_OPTIONS } from "../model";
import type { Announcement } from "../types";

import {
  deleteTargetLabelOf,
  PengumumanListItemRow,
  pengumumanTable,
} from "./list-item";

const LIST_FILTERS = {
  kategori: { api: "category" },
  bapel: { api: "bapelId" },
} satisfies ListFilterSchema;

export const PengumumanListContent = () => {
  const { isCanCreate, isCanUpdate, isCanDelete } = useMenuAccess(
    MENU.PENGUMUMAN,
  );

  const toast = useToast();

  // Satu keadaan menyimpan baris yang akan dihapus sekaligus status terbuka
  // dialognya. Hook hapus dibuat ulang mengikuti kunci baris ini.
  const [target, setTarget] = useState<Announcement | null>(null);
  const deleteRow = useDeletePengumuman(target?.code);
  const listParams = useListParams({ filters: LIST_FILTERS });
  const pengumumanList = usePengumumanList(listParams);
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
        title="Pengumuman"
        subtitle={
          pengumumanList.totalData === undefined
            ? undefined
            : `${pengumumanList.totalData} pengumuman`
        }
        backHref={domainHref(MENU.KEGIATAN)}
        action={
          isCanCreate ? (
            <PageHeaderAdd
              href={createHref(MENU.KEGIATAN, MENU.PENGUMUMAN)}
              label="Buat pengumuman"
            />
          ) : null
        }
      />

      <ListToolbar
        listParams={listParams}
        searchLabel="Cari pengumuman"
        searchPlaceholder="Cari judul pengumuman"
        filters={[
          {
            key: "kategori",
            label: "Kategori",
            kind: "select",
            options: [
              { value: "", label: "Semua kategori" },
              ...CATEGORY_OPTIONS,
            ],
          },
          {
            key: "status",
            label: "Status",
            kind: "select",
            options: [{ value: "", label: "Semua status" }, ...STATUS_OPTIONS],
          },
          {
            key: "bapel",
            label: "Badan pelayanan",
            kind: "select",
            options: bapel.options,
            emptyMessage: "Belum ada data badan pelayanan",
          },
        ]}
      />

      <DataList
        loadingShape="trailing"
        items={pengumumanList.items}
        getKey={(announcement) => announcement.code}
        label="Daftar pengumuman"
        isLoading={pengumumanList.isLoading}
        isRefreshing={pengumumanList.isRefreshing}
        error={pengumumanList.error}
        onRetry={pengumumanList.onRetry}
        emptyTitle={
          isNarrowed ? "Tidak ada pengumuman" : "Belum ada pengumuman"
        }
        emptyDescription={
          isNarrowed
            ? "Tidak ada pengumuman yang cocok dengan filter ini."
            : "Buat warta atau pengumuman untuk jemaat dan website gereja."
        }
        onClearFilter={
          listParams.isFiltered ? listParams.onClearFilters : undefined
        }
        pagination={pengumumanList.pagination}
        table={pengumumanTable(
          isCanUpdate,
          isCanDelete ? setTarget : undefined,
        )}
        itemNoun="pengumuman"
      >
        {(announcement) => (
          <PengumumanListItemRow announcement={announcement} />
        )}
      </DataList>

      <RowDeleteDialog
        target={target ? { label: deleteTargetLabelOf(target) } : null}
        entity="pengumuman"
        isPending={deleteRow.isPending}
        errorMessage={deleteRow.error?.message}
        onCancel={onCancelDelete}
        onConfirm={onDelete}
      />
    </div>
  );
};
