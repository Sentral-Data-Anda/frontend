"use client";

import { DataList, ListToolbar } from "@/components/common/list";
import { PageHeader, PageHeaderAdd } from "@/components/layout";
import { MENU, createHref, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useListParams } from "@/hooks/use-list-params";

import { useTipeCutiList } from "../api";

import { TipeCutiListItemRow, tipeCutiTable } from "./list-item";

// Nol tipe di-seed: ini keadaan hari pertama. Kalimat, bukan tombol penyemai.
const EMPTY_DESCRIPTION =
  "Gereja yang menentukan jenis cutinya sendiri. Yang lazim dipakai: cuti tahunan, sakit, melahirkan, menikah, dan duka — tambahkan yang berlaku di sini beserta jatah harinya.";

export const TipeCutiList = () => {
  const { isCanCreate, isCanUpdate } = useMenuAccess(MENU.TIPE_CUTI);
  const listParams = useListParams();
  const tipeCutiList = useTipeCutiList(listParams);
  const isSearched = Boolean(listParams.search);

  return (
    <div className="pb-6">
      <PageHeader
        title="Tipe Cuti"
        subtitle={
          tipeCutiList.totalData === undefined
            ? undefined
            : `${tipeCutiList.totalData} tipe cuti`
        }
        backHref={domainHref(MENU.SDM)}
        action={
          isCanCreate ? (
            <PageHeaderAdd
              href={createHref(MENU.SDM, MENU.TIPE_CUTI)}
              label="Tambah tipe cuti"
            />
          ) : null
        }
      />

      <ListToolbar
        listParams={listParams}
        searchLabel="Cari tipe cuti"
        searchPlaceholder="Cari nama tipe cuti"
      />

      <DataList
        loadingShape="trailing"
        items={tipeCutiList.items}
        getKey={(row) => row.code}
        label="Daftar tipe cuti"
        isLoading={tipeCutiList.isLoading}
        isRefreshing={tipeCutiList.isRefreshing}
        error={tipeCutiList.error}
        onRetry={tipeCutiList.onRetry}
        emptyTitle={isSearched ? "Tidak ada tipe cuti" : "Belum ada tipe cuti"}
        emptyDescription={
          isSearched
            ? "Tidak ada tipe cuti yang cocok dengan pencarian."
            : EMPTY_DESCRIPTION
        }
        pagination={tipeCutiList.pagination}
        table={tipeCutiTable(isCanUpdate)}
        itemNoun="tipe cuti"
      >
        {(row) => (
          <TipeCutiListItemRow tipeCuti={row} isCanUpdate={isCanUpdate} />
        )}
      </DataList>
    </div>
  );
};
