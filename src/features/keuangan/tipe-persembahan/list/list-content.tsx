"use client";

import { DataList, ListToolbar } from "@/components/common/list";
import { PageHeader, PageHeaderAdd } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useListParams } from "@/hooks/use-list-params";

import { useOfferingTypeList } from "../api";
import { TIPE_PERSEMBAHAN_CREATE_PATH } from "../model";
import { OFFERING_TYPE_STATUS_FILTER } from "../types";

import { OfferingTypeListItemRow, offeringTypeTable } from "./list-item";

export const OfferingTypeListContent = () => {
  const { isCanCreate, isCanUpdate } = useMenuAccess(MENU.TIPE_PERSEMBAHAN);
  const listParams = useListParams();
  const offeringTypeList = useOfferingTypeList(listParams);
  const isNarrowed = Boolean(listParams.search) || listParams.isFiltered;

  return (
    <div className="pb-6">
      <PageHeader
        title="Tipe Persembahan"
        subtitle={
          offeringTypeList.totalData === undefined
            ? undefined
            : `${offeringTypeList.totalData} tipe`
        }
        backHref={domainHref(MENU.KEUANGAN)}
        action={
          isCanCreate ? (
            <PageHeaderAdd
              href={TIPE_PERSEMBAHAN_CREATE_PATH}
              label="Tambah tipe persembahan"
            />
          ) : null
        }
      />

      <ListToolbar
        listParams={listParams}
        searchLabel="Cari tipe persembahan"
        searchPlaceholder="Cari nama tipe"
        filters={[
          {
            key: "status",
            label: "Status",
            kind: "choice",
            options: OFFERING_TYPE_STATUS_FILTER,
          },
        ]}
      />

      <DataList
        loadingShape="trailing"
        items={offeringTypeList.items}
        getKey={(offeringType) => offeringType.code}
        label="Daftar tipe persembahan"
        isLoading={offeringTypeList.isLoading}
        isRefreshing={offeringTypeList.isRefreshing}
        error={offeringTypeList.error}
        onRetry={offeringTypeList.onRetry}
        emptyTitle={
          isNarrowed
            ? "Tidak ada tipe persembahan"
            : "Belum ada tipe persembahan"
        }
        emptyDescription={
          isNarrowed
            ? "Tidak ada tipe persembahan yang cocok dengan filter ini."
            : "Tambahkan jenis persembahan yang dicatat gereja, mis. Kolekte atau Perpuluhan. Tiap tipe menunjuk akun pendapatannya sendiri."
        }
        onClearFilter={
          listParams.isFiltered ? listParams.onClearFilters : undefined
        }
        pagination={offeringTypeList.pagination}
        table={offeringTypeTable(isCanUpdate)}
        itemNoun="tipe"
      >
        {(offeringType) => (
          <OfferingTypeListItemRow
            offeringType={offeringType}
            isCanUpdate={isCanUpdate}
          />
        )}
      </DataList>
    </div>
  );
};
