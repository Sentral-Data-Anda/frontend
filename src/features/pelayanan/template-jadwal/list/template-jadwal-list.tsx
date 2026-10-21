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
import { useListParams, type ListFilterSchema } from "@/hooks/use-list-params";

import {
  useBapelOptions,
  useDeleteTemplateJadwal,
  useTemplateJadwalList,
} from "../api";
import type { TemplateJadwalListItem } from "../types";

import {
  deleteTargetLabelOf,
  TemplateJadwalListItemRow,
  templateJadwalTable,
} from "./list-item";

const LIST_FILTERS = { bapel: { api: "bapelId" } } satisfies ListFilterSchema;

export const TemplateJadwalList = () => {
  const { isCanCreate, isCanUpdate, isCanDelete } = useMenuAccess(
    MENU.TEMPLATE_JADWAL,
  );

  const toast = useToast();

  // Satu keadaan menyimpan baris yang akan dihapus sekaligus status terbuka
  // dialognya. Hook hapus dibuat ulang mengikuti kunci baris ini.
  const [target, setTarget] = useState<TemplateJadwalListItem | null>(null);
  const deleteRow = useDeleteTemplateJadwal(target?.code);
  const listParams = useListParams({ filters: LIST_FILTERS });
  const templateList = useTemplateJadwalList(listParams);
  const bapel = useBapelOptions();
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
        title="Template Jadwal"
        subtitle={
          templateList.totalData === undefined
            ? undefined
            : `${templateList.totalData} template`
        }
        backHref={domainHref(MENU.PELAYANAN)}
        action={
          isCanCreate ? (
            <PageHeaderAdd
              href={createHref(MENU.PELAYANAN, MENU.TEMPLATE_JADWAL)}
              label="Tambah template jadwal"
            />
          ) : null
        }
      />

      <ListToolbar
        listParams={listParams}
        searchLabel="Cari template jadwal"
        searchPlaceholder="Cari nama atau kode template"
        filters={[
          {
            key: "bapel",
            label: "Badan pelayanan",
            kind: "select",
            options: [
              { value: "", label: "Semua badan pelayanan" },
              ...bapel.options,
            ],
            emptyMessage: "Belum ada data badan pelayanan",
          },
        ]}
      />

      <DataList
        loadingShape="trailing"
        items={templateList.items}
        getKey={(template) => template.code}
        label="Daftar template jadwal"
        isLoading={templateList.isLoading}
        isRefreshing={templateList.isRefreshing}
        error={templateList.error}
        onRetry={templateList.onRetry}
        emptyTitle={
          isNarrowed ? "Tidak ada template jadwal" : "Belum ada template jadwal"
        }
        emptyDescription={
          isNarrowed
            ? "Tidak ada template yang cocok dengan pencarian atau filter ini."
            : "Simpan susunan tugas yang berulang, mis. Ibadah Minggu Pagi, supaya jadwal pelayan tinggal diisi orangnya."
        }
        onClearFilter={
          listParams.isFiltered ? listParams.onClearFilters : undefined
        }
        pagination={templateList.pagination}
        table={templateJadwalTable(
          isCanUpdate,
          isCanDelete ? setTarget : undefined,
        )}
        itemNoun="template"
      >
        {(template) => <TemplateJadwalListItemRow template={template} />}
      </DataList>

      <RowDeleteDialog
        target={target ? { label: deleteTargetLabelOf(target) } : null}
        entity="template"
        isPending={deleteRow.isPending}
        errorMessage={deleteRow.error?.message}
        onCancel={onCancelDelete}
        onConfirm={onDelete}
      />
    </div>
  );
};
