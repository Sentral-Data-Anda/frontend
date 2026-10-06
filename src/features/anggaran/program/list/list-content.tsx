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

import { useBudgetSetting, useProgramList } from "../api";
import {
  EMPTY_DESCRIPTION,
  EMPTY_TITLE,
  LIST_FILTERS,
  PROGRAM_CREATE_PATH,
  STATUS_TABS,
  yearLabelOf,
  yearSelectOptions,
} from "../model";

import { ProgramListItem, programTable } from "./list-item";

const TITLE = "Program";

export const ProgramListContent = () => {
  const { isCanCreate, isCanUpdate } = useMenuAccess(MENU.PROGRAM);
  const listParams = useListParams({ filters: LIST_FILTERS });
  const setting = useBudgetSetting();
  const year =
    listParams.filters.tahun ||
    (setting.data ? String(setting.data.budgetYear.year) : "");
  const programList = useProgramList(listParams, year);
  const bapels = useDdlOptions("bapel", "id", listParams.filters.komisi);
  const items = programList.items;
  const isNarrowed = Boolean(listParams.search) || listParams.isFiltered;
  const isEmpty =
    !programList.isLoading && !programList.error && items?.length === 0;
  const years = setting.data?.budgetYears ?? [];
  const yearLabel = yearLabelOf(years, year);

  return (
    <div className="pb-6">
      <PageHeader
        title={TITLE}
        subtitle={
          programList.totalData === undefined
            ? yearLabel || undefined
            : `${yearLabel} · ${programList.totalData} usulan`
        }
        backHref={domainHref(MENU.ANGGARAN)}
        action={
          isCanCreate ? (
            <PageHeaderAdd href={PROGRAM_CREATE_PATH} label="Tambah program" />
          ) : null
        }
      />

      <ListTabs
        label="Status program"
        value={listParams.status}
        options={STATUS_TABS}
        onValueChange={(status) => listParams.onPickFilter("status", status)}
      />

      <ListToolbar
        listParams={listParams}
        searchLabel="Cari program"
        searchPlaceholder="Cari kode atau nama program"
        filters={[
          ...(years.length > 0
            ? [
                {
                  key: "tahun",
                  label: "Tahun pelayanan",
                  kind: "select" as const,
                  options: yearSelectOptions(years),
                },
              ]
            : []),
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
                href={PROGRAM_CREATE_PATH}
                className={buttonVariants({ variant: "outline" })}
              >
                Tambah program
              </Link>
            ) : null
          }
          className="py-12"
        />
      ) : (
        <DataList
          items={items}
          getKey={(row) => row.publicId}
          label="Daftar program"
          isLoading={programList.isLoading || setting.isLoading}
          isRefreshing={programList.isRefreshing}
          error={programList.error}
          onRetry={programList.onRetry}
          emptyTitle="Tidak ada program"
          emptyDescription="Tidak ada program yang cocok dengan filter ini."
          onClearFilter={
            listParams.isFiltered ? listParams.onClearFilters : undefined
          }
          pagination={programList.pagination}
          table={programTable(isCanUpdate)}
          itemNoun="usulan"
        >
          {(row) => <ProgramListItem row={row} isCanUpdate={isCanUpdate} />}
        </DataList>
      )}
    </div>
  );
};
