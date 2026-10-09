"use client";

import { EmptyState } from "@/components/common/feedback";
import { DataList, ListToolbar } from "@/components/common/list";
import { PageHeader, PageHeaderAdd } from "@/components/layout";
import { MENU, createHref, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useListParams, type ListFilterSchema } from "@/hooks/use-list-params";

import { useSetelanList } from "../api";
import { DOCUMENT_FILTER_OPTIONS, STATUS_FILTER_OPTIONS } from "../model";

import { SetelanListItemRow, setelanTable } from "./list-item";

const LIST_FILTERS = {
  jenis: { api: "documentType" },
} satisfies ListFilterSchema;

export const SetelanListScreen = () => {
  const { isCanView, isCanCreate, isCanUpdate } = useMenuAccess(
    MENU.APPROVAL_WORKFLOW,
  );
  const listParams = useListParams({ filters: LIST_FILTERS });
  const setelanList = useSetelanList(listParams);

  return (
    <div className="pb-6">
      <PageHeader
        title="Approval Workflow"
        subtitle={
          !isCanView || setelanList.totalData === undefined
            ? undefined
            : `${setelanList.totalData} alur`
        }
        backHref={domainHref(MENU.APPROVAL)}
        action={
          isCanView && isCanCreate ? (
            <PageHeaderAdd
              href={createHref(MENU.APPROVAL, MENU.APPROVAL_WORKFLOW)}
              label="Tambah alur"
            />
          ) : null
        }
      />

      {isCanView ? (
        <>
          <ListToolbar
            listParams={listParams}
            filters={[
              {
                key: "jenis",
                label: "Jenis dokumen",
                kind: "select",
                options: DOCUMENT_FILTER_OPTIONS,
              },
              {
                key: "status",
                label: "Status",
                kind: "choice",
                options: STATUS_FILTER_OPTIONS,
              },
            ]}
          />

          <DataList
            loadingShape="trailing"
            items={setelanList.items}
            getKey={(item) => item.publicId}
            label="Daftar alur persetujuan"
            isLoading={setelanList.isLoading}
            isRefreshing={setelanList.isRefreshing}
            error={setelanList.error}
            onRetry={setelanList.onRetry}
            emptyTitle={
              listParams.isFiltered
                ? "Tidak ada alur"
                : "Belum ada alur persetujuan"
            }
            emptyDescription={
              listParams.isFiltered
                ? "Tidak ada alur untuk jenis dokumen atau status ini."
                : "Dokumen yang diajukan akan ditolak sampai ada alur yang cocok dengan jenis dan nominalnya. Tambahkan alur pertama."
            }
            onClearFilter={
              listParams.isFiltered ? listParams.onClearFilters : undefined
            }
            pagination={setelanList.pagination}
            table={setelanTable(isCanUpdate)}
            itemNoun="alur"
          >
            {(item) => (
              <SetelanListItemRow item={item} isCanUpdate={isCanUpdate} />
            )}
          </DataList>
        </>
      ) : (
        <EmptyState
          title="Anda tidak memiliki akses ke Approval Workflow"
          description="Hubungi administrator bila Anda memerlukan akses ini."
        />
      )}
    </div>
  );
};
