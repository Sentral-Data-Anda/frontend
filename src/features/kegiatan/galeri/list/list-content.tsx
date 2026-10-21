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

import { useDeleteGaleri, useGaleriList } from "../api";
import { GALERI_CREATE_PATH } from "../model";
import type { Album } from "../types";

import {
  deleteTargetLabelOf,
  GaleriListItemRow,
  galeriTable,
} from "./list-item";

const LIST_FILTERS = {
  bapel: { api: "bapelId" },
} satisfies ListFilterSchema;

export const GaleriListContent = () => {
  const { isCanCreate, isCanUpdate, isCanDelete } = useMenuAccess(MENU.GALERI);

  const toast = useToast();

  // Satu keadaan menyimpan baris yang akan dihapus sekaligus status terbuka
  // dialognya. Hook hapus dibuat ulang mengikuti kunci baris ini.
  const [target, setTarget] = useState<Album | null>(null);
  const deleteRow = useDeleteGaleri(target?.code);
  const listParams = useListParams({ filters: LIST_FILTERS });
  const galeriList = useGaleriList(listParams);
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
        title="Galeri"
        subtitle={
          galeriList.totalData === undefined
            ? undefined
            : `${galeriList.totalData} album`
        }
        backHref={domainHref(MENU.KEGIATAN)}
        action={
          isCanCreate ? (
            <PageHeaderAdd href={GALERI_CREATE_PATH} label="Tambah album" />
          ) : null
        }
      />

      <ListToolbar
        listParams={listParams}
        searchLabel="Cari album"
        searchPlaceholder="Cari nama album"
        filters={[
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
        items={galeriList.items}
        getKey={(album) => album.code}
        label="Daftar album"
        isLoading={galeriList.isLoading}
        isRefreshing={galeriList.isRefreshing}
        error={galeriList.error}
        onRetry={galeriList.onRetry}
        emptyTitle={isNarrowed ? "Tidak ada album" : "Belum ada album"}
        emptyDescription={
          isNarrowed
            ? "Tidak ada album yang cocok dengan pencarian atau filter ini."
            : "Buat album untuk menyimpan foto kegiatan gereja."
        }
        onClearFilter={
          listParams.isFiltered ? listParams.onClearFilters : undefined
        }
        pagination={galeriList.pagination}
        table={galeriTable(isCanUpdate, isCanDelete ? setTarget : undefined)}
        itemNoun="album"
      >
        {(album) => <GaleriListItemRow album={album} />}
      </DataList>

      <RowDeleteDialog
        target={target ? { label: deleteTargetLabelOf(target) } : null}
        entity="album"
        isPending={deleteRow.isPending}
        errorMessage={deleteRow.error?.message}
        onCancel={onCancelDelete}
        onConfirm={onDelete}
      />
    </div>
  );
};
