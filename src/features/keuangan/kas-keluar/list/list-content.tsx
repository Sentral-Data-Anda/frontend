"use client";

import { DataList, ListTabs, ListToolbar } from "@/components/common/list";
import { PageHeader, PageHeaderAdd } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useDdlOptions } from "@/hooks/use-ddl-options";
import { useListParams, type ListFilterSchema } from "@/hooks/use-list-params";
import { monthOptions } from "@/lib/date";

import { useExpenseList } from "../api";
import {
  ALL_MONTHS,
  EMPTY_DESCRIPTION,
  EMPTY_TITLE,
  EXPENSE_CREATE_PATH,
  STATUS_TABS,
} from "../model";

import { ExpenseListItem, expenseTable } from "./list-item";

const LIST_FILTERS = {
  bulan: { api: "bulan" },
  badan: { api: "bapelId" },
} satisfies ListFilterSchema;

const MONTH_OPTIONS = [
  { value: ALL_MONTHS, label: "Semua bulan" },
  ...monthOptions(),
];

export const ExpenseListContent = () => {
  const { isCanCreate, isCanUpdate } = useMenuAccess(MENU.KAS_KELUAR);
  const listParams = useListParams({ filters: LIST_FILTERS });
  const expenseList = useExpenseList(listParams);
  const bapels = useDdlOptions("bapel", "id", listParams.filters.badan);
  const isNarrowed = Boolean(listParams.search) || listParams.isFiltered;

  return (
    <div className="pb-6">
      <PageHeader
        title="Kas Keluar"
        subtitle={
          expenseList.totalData === undefined
            ? undefined
            : `${expenseList.totalData} kas keluar`
        }
        backHref={domainHref(MENU.KEUANGAN)}
        action={
          isCanCreate ? (
            <PageHeaderAdd
              href={EXPENSE_CREATE_PATH}
              label="Tambah kas keluar"
            />
          ) : null
        }
      />

      <ListTabs
        label="Status kas keluar"
        value={listParams.status}
        options={STATUS_TABS}
        onValueChange={(status) => listParams.onPickFilter("status", status)}
      />

      <ListToolbar
        listParams={listParams}
        searchLabel="Cari kas keluar"
        searchPlaceholder="Cari kode, penerima, atau referensi"
        filters={[
          {
            key: "bulan",
            label: "Bulan",
            kind: "select",
            options: MONTH_OPTIONS,
          },
          {
            key: "badan",
            label: "Badan pelayanan",
            kind: "select",
            options: [
              { value: "", label: "Semua badan pelayanan" },
              ...bapels.options,
            ],
          },
        ]}
      />

      <DataList
        loadingShape="trailing"
        items={expenseList.items}
        getKey={(row) => row.publicId}
        label="Daftar kas keluar"
        isLoading={expenseList.isLoading}
        isRefreshing={expenseList.isRefreshing}
        error={expenseList.error}
        onRetry={expenseList.onRetry}
        emptyTitle={isNarrowed ? "Tidak ada kas keluar" : EMPTY_TITLE}
        emptyDescription={
          isNarrowed
            ? "Tidak ada kas keluar yang cocok dengan filter ini."
            : EMPTY_DESCRIPTION
        }
        onClearFilter={
          listParams.isFiltered ? listParams.onClearFilters : undefined
        }
        pagination={expenseList.pagination}
        table={expenseTable(isCanUpdate)}
        itemNoun="kas keluar"
      >
        {(row) => <ExpenseListItem row={row} isCanUpdate={isCanUpdate} />}
      </DataList>
    </div>
  );
};
