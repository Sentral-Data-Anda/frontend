"use client";

import { DataList, ListToolbar } from "@/components/common/list";
import { PageHeader, PageHeaderAdd } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useListParams } from "@/hooks/use-list-params";

import { useKaryawanList } from "../api";
import {
  EMPTY_DESCRIPTION,
  EMPTY_TITLE,
  FILTERED_DESCRIPTION,
  KARYAWAN_CREATE_PATH,
} from "../model";

import { KaryawanListItem, karyawanTable } from "./list-item";

export const KaryawanListContent = () => {
  const { isCanCreate, isCanUpdate } = useMenuAccess(MENU.EMPLOYEE);
  const listParams = useListParams();
  const karyawanList = useKaryawanList(listParams);
  const isNarrowed = Boolean(listParams.search);

  return (
    <div className="pb-6">
      <PageHeader
        title="Employee"
        subtitle={
          karyawanList.totalData === undefined
            ? undefined
            : `${karyawanList.totalData} karyawan`
        }
        backHref={domainHref(MENU.HR)}
        action={
          isCanCreate ? (
            <PageHeaderAdd
              href={KARYAWAN_CREATE_PATH}
              label="Tambah karyawan"
            />
          ) : null
        }
      />

      <ListToolbar
        listParams={listParams}
        searchLabel="Cari karyawan"
        searchPlaceholder="Cari nama atau jabatan"
      />

      <DataList
        items={karyawanList.items}
        getKey={(row) => row.code}
        label="Daftar karyawan"
        isLoading={karyawanList.isLoading}
        isRefreshing={karyawanList.isRefreshing}
        error={karyawanList.error}
        onRetry={karyawanList.onRetry}
        emptyTitle={isNarrowed ? "Tidak ada karyawan" : EMPTY_TITLE}
        emptyDescription={isNarrowed ? FILTERED_DESCRIPTION : EMPTY_DESCRIPTION}
        pagination={karyawanList.pagination}
        table={karyawanTable(isCanUpdate)}
        itemNoun="karyawan"
      >
        {(row) => <KaryawanListItem row={row} isCanUpdate={isCanUpdate} />}
      </DataList>
    </div>
  );
};
