"use client";

import { DataList, ListToolbar } from "@/components/common/list";
import { PageHeader, PageHeaderAdd } from "@/components/layout";
import { MENU, createHref, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useListParams, type ListFilterSchema } from "@/hooks/use-list-params";

import { useBapelOptions, useTemplateJadwalList } from "../api";

import { TemplateJadwalListItemRow, templateJadwalTable } from "./list-item";

const LIST_FILTERS = { bapel: { api: "bapelId" } } satisfies ListFilterSchema;

export const TemplateJadwalList = () => {
  const { isCanCreate, isCanUpdate } = useMenuAccess(MENU.TEMPLATE_JADWAL);
  const listParams = useListParams({ filters: LIST_FILTERS });
  const templateList = useTemplateJadwalList(listParams);
  const bapel = useBapelOptions();
  const isNarrowed = Boolean(listParams.search) || listParams.isFiltered;

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
        table={templateJadwalTable(isCanUpdate)}
        itemNoun="template"
      >
        {(template) => (
          <TemplateJadwalListItemRow
            template={template}
            isCanUpdate={isCanUpdate}
          />
        )}
      </DataList>
    </div>
  );
};
