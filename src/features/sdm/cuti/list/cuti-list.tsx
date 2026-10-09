"use client";

import { DataList, ListTabs, ListToolbar } from "@/components/common/list";
import { PageHeader, PageHeaderAdd } from "@/components/layout";
import { MENU, createHref, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useDdlOptions } from "@/hooks/use-ddl-options";
import { useListParams, type ListFilterSchema } from "@/hooks/use-list-params";

import { useCutiList } from "../api";
import { EMPTY_DESCRIPTION, EMPTY_TITLE, STATUS_TABS } from "../model";

import { CutiListItem, cutiTable } from "./list-item";

const LIST_FILTERS = {
  karyawan: { api: "karyawanId" },
  tipe: { api: "leaveTypeId" },
} satisfies ListFilterSchema;

export const CutiList = () => {
  const { isCanCreate } = useMenuAccess(MENU.LEAVE);
  const listParams = useListParams({ filters: LIST_FILTERS });
  const cutiList = useCutiList(listParams);
  const karyawan = useDdlOptions("karyawan", "id", listParams.filters.karyawan);
  const leaveTypes = useDdlOptions("tipe-cuti", "id", listParams.filters.tipe);
  const isNarrowed = listParams.isFiltered || Boolean(listParams.status);

  return (
    <div className="pb-6">
      <PageHeader
        title="Leave"
        subtitle={
          cutiList.totalData === undefined
            ? undefined
            : `${cutiList.totalData} pengajuan cuti`
        }
        backHref={domainHref(MENU.HR)}
        action={
          isCanCreate ? (
            <PageHeaderAdd
              href={createHref(MENU.HR, MENU.LEAVE)}
              label="Ajukan cuti"
            />
          ) : null
        }
      />

      <ListTabs
        label="Status pengajuan cuti"
        value={listParams.status}
        options={STATUS_TABS}
        onValueChange={(status) => listParams.onPickFilter("status", status)}
      />

      <ListToolbar
        listParams={listParams}
        filters={[
          {
            key: "karyawan",
            label: "Karyawan",
            kind: "select",
            options: [
              { value: "", label: "Semua karyawan" },
              ...karyawan.options,
            ],
          },
          {
            key: "tipe",
            label: "Tipe cuti",
            kind: "select",
            options: [
              { value: "", label: "Semua tipe cuti" },
              ...leaveTypes.options,
            ],
          },
        ]}
      />

      <DataList
        loadingShape="trailing"
        items={cutiList.items}
        getKey={(row) => row.code}
        label="Daftar pengajuan cuti"
        isLoading={cutiList.isLoading}
        isRefreshing={cutiList.isRefreshing}
        error={cutiList.error}
        onRetry={cutiList.onRetry}
        emptyTitle={isNarrowed ? "Tidak ada pengajuan cuti" : EMPTY_TITLE}
        emptyDescription={
          isNarrowed
            ? "Tidak ada pengajuan cuti yang cocok dengan filter ini."
            : EMPTY_DESCRIPTION
        }
        onClearFilter={
          listParams.isFiltered ? listParams.onClearFilters : undefined
        }
        pagination={cutiList.pagination}
        table={cutiTable()}
        itemNoun="pengajuan cuti"
      >
        {(row) => <CutiListItem cuti={row} />}
      </DataList>
    </div>
  );
};
