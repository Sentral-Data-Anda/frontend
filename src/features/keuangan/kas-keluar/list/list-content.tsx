"use client";

import {
  DataList,
  ListTabs,
  ListToolbar,
  PrintListButton,
  PrintSheet,
} from "@/components/common/list";
import { PageHeader, PageHeaderAdd } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useDdlOptions } from "@/hooks/use-ddl-options";
import { useListParams, type ListFilterSchema } from "@/hooks/use-list-params";
import { usePrintList } from "@/hooks/use-print-list";
import { monthOptions } from "@/lib/date";

import { fetchExpensePage, useExpenseList } from "../api";
import {
  ALL_MONTHS,
  EMPTY_DESCRIPTION,
  EMPTY_TITLE,
  EXPENSE_CREATE_PATH,
  printSubtitleOf,
  STATUS_TABS,
  toExpenseQuery,
} from "../model";

import { ExpenseListItem, expenseTable } from "./list-item";
import { EXPENSE_PRINT_COLUMNS, expensePrintTotal } from "./print-columns";

const LIST_FILTERS = {
  // URL kosong = bulan ini, yang menyaring; "semua" yang tidak.
  bulan: { api: "bulan", defaultValue: ALL_MONTHS },
  badan: { api: "bapelId" },
} satisfies ListFilterSchema;

// Bawaan daftar punya pilihannya sendiri: tanpa itu select-nya kosong dan
// label filter aktifnya tanpa nama di keadaan yang paling sering dibuka.
const MONTH_OPTIONS = [
  { value: "", label: "Bulan ini" },
  { value: ALL_MONTHS, label: "Semua bulan" },
  ...monthOptions(),
];

export const ExpenseListContent = () => {
  const { isCanCreate, isCanUpdate } = useMenuAccess(MENU.KAS_KELUAR);
  const listParams = useListParams({ filters: LIST_FILTERS });
  const expenseList = useExpenseList(listParams);
  const bapels = useDdlOptions("bapel", "id", listParams.filters.badan);
  const isNarrowed = Boolean(listParams.search) || listParams.isFiltered;
  // Filter tab dan bulan diterjemahkan ke query API oleh toExpenseQuery; tanpa
  // itu lembar cetaknya akan memuat baris yang tidak ada di layar.
  const print = usePrintList({
    fetchPage: fetchExpensePage,
    params: {
      ...listParams,
      ...toExpenseQuery(listParams.status, listParams.filters),
    },
  });

  return (
    <div className="pb-6">
      <PageHeader
        title="Kas Keluar"
        subtitle={
          expenseList.totalData === undefined
            ? undefined
            : `${expenseList.totalData} kas keluar`
        }
        backHref={domainHref(MENU.FINANCE)}
        action={
          <span className="flex items-center gap-2">
            <PrintListButton
              isPending={print.isPending}
              onPrint={() => void print.onPrint()}
            />
            {isCanCreate ? (
              <PageHeaderAdd
                href={EXPENSE_CREATE_PATH}
                label="Tambah kas keluar"
              />
            ) : null}
          </span>
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
            defaultValue: ALL_MONTHS,
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

      {/* Saat mencetak, yang dipakai lembar penuh di bawah — daftar berhalaman
          di layar ini justru akan ikut tercetak sebagian. */}
      <div className={print.rows ? "print:hidden" : undefined}>
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
              ? "Tidak ada kas keluar yang cocok dengan pencarian atau filter ini. Bawaannya hanya bulan berjalan."
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

      {print.error ? (
        <p role="alert" className="text-destructive px-gutter pt-3 text-body">
          Daftar gagal disiapkan untuk dicetak. Coba lagi.
        </p>
      ) : null}

      {print.rows ? (
        <PrintSheet
          title="Kas Keluar"
          subtitle={printSubtitleOf(listParams.filters, listParams.search)}
          columns={EXPENSE_PRINT_COLUMNS}
          rows={print.rows}
          getKey={(row) => row.publicId}
          footer={`Jumlah: ${expensePrintTotal(print.rows)}`}
        />
      ) : null}
    </div>
  );
};
