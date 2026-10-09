"use client";

import Link from "next/link";

import { buttonVariants } from "@/components/common/control";
import { EmptyState } from "@/components/common/feedback";
import { DataList, ListTabs, ListToolbar } from "@/components/common/list";
import { PageHeader, PageHeaderAdd } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useDdlOptions } from "@/hooks/use-ddl-options";
import { useListParams } from "@/hooks/use-list-params";
import { monthOptions } from "@/lib/date";

import { useReportList } from "../api";
import {
  EMPTY_DESCRIPTION,
  EMPTY_TITLE,
  LIST_FILTERS,
  PENDING_TAB,
  REPORT_CREATE_PATH,
  STATUS_OPTIONS,
  VIEW_TABS,
  previousMonthOf,
} from "../model";
import { PendingContent } from "../pending";

import { ReportListItem, reportTable } from "./list-item";

const TITLE = "Laporan Budget";

export const ReportListContent = () => {
  const { isCanCreate, isCanUpdate } = useMenuAccess(MENU.BUDGET_REALIZATION);
  const listParams = useListParams({ filters: LIST_FILTERS });
  const tab = listParams.filters.tab === PENDING_TAB ? PENDING_TAB : "";
  const reportList = useReportList(listParams);
  const bapels = useDdlOptions("bapel", "id", listParams.filters.komisi);
  const items = reportList.items;
  const isNarrowed = Boolean(listParams.search) || listParams.isFiltered;
  const isEmpty =
    !reportList.isLoading && !reportList.error && items?.length === 0;

  const onPickMonth = (month: string) =>
    listParams.onPickFilter("bulan", month);

  return (
    <div className="pb-6">
      <PageHeader
        title={TITLE}
        subtitle={
          reportList.totalData === undefined || tab === PENDING_TAB
            ? undefined
            : `${reportList.totalData} laporan`
        }
        backHref={domainHref(MENU.REPORT)}
        action={
          isCanCreate ? (
            <PageHeaderAdd href={REPORT_CREATE_PATH} label="Tambah laporan" />
          ) : null
        }
      />

      <ListTabs
        label="Tampilan laporan budget"
        value={tab}
        options={VIEW_TABS}
        onValueChange={(next) => listParams.onPickFilter("tab", next)}
      />

      {tab === PENDING_TAB ? (
        <PendingContent
          month={listParams.filters.bulan || previousMonthOf()}
          isCanCreate={isCanCreate}
          onPickMonth={onPickMonth}
        />
      ) : (
        <>
          <ListToolbar
            listParams={listParams}
            searchLabel="Cari laporan"
            searchPlaceholder="Cari kode atau nama badan pelayanan"
            filters={[
              {
                key: "status",
                label: "Status",
                kind: "choice",
                options: STATUS_OPTIONS,
              },
              {
                key: "bulan",
                label: "Bulan",
                kind: "select",
                options: [
                  { value: "", label: "Semua bulan" },
                  ...monthOptions(),
                ],
              },
              {
                key: "komisi",
                label: "Badan pelayanan",
                kind: "select",
                options: [
                  { value: "", label: "Semua badan pelayanan" },
                  ...bapels.options,
                ],
              },
            ]}
          />

          {isEmpty && !isNarrowed ? (
            <EmptyState
              title={EMPTY_TITLE}
              description={EMPTY_DESCRIPTION}
              action={
                isCanCreate ? (
                  <Link
                    href={REPORT_CREATE_PATH}
                    className={buttonVariants({ variant: "outline" })}
                  >
                    Tambah laporan
                  </Link>
                ) : null
              }
              className="py-12"
            />
          ) : (
            <DataList
              loadingShape="trailing"
              items={items}
              getKey={(row) => row.publicId}
              label="Daftar laporan pemakaian budget"
              isLoading={reportList.isLoading}
              isRefreshing={reportList.isRefreshing}
              error={reportList.error}
              onRetry={reportList.onRetry}
              emptyTitle="Tidak ada laporan"
              emptyDescription="Tidak ada laporan yang cocok dengan filter ini."
              onClearFilter={
                listParams.isFiltered ? listParams.onClearFilters : undefined
              }
              pagination={reportList.pagination}
              table={reportTable(isCanUpdate)}
              itemNoun="laporan"
            >
              {(row) => <ReportListItem row={row} isCanUpdate={isCanUpdate} />}
            </DataList>
          )}
        </>
      )}
    </div>
  );
};
