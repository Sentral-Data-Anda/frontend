"use client";

import { useState } from "react";

import { useToast } from "@/components/common/feedback";
import {
  CsvDownloadButton,
  DataList,
  ListTabs,
  ListToolbar,
  PrintListButton,
  toCsvColumns,
  PrintSheet,
  RowDeleteDialog,
} from "@/components/common/list";
import { PageHeader, PageHeaderAdd } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useListExport } from "@/hooks/use-list-export";
import { useListParams } from "@/hooks/use-list-params";

import {
  fetchReceiptPage,
  RECEIPT_FILTERS,
  useReceiptList,
  useReceiptAction,
} from "../api";
import {
  EMPTY_DESCRIPTION,
  EMPTY_TITLE,
  KAS_MASUK_CREATE_PATH,
  MONTH_ALL,
  PERSEMBAHAN_NOTE,
  printSubtitleOf,
  STATUS_TABS,
  TITLE,
  monthFilterOptions,
} from "../model";
import type { CashReceipt } from "../types";

import { GatewayShortcut } from "./gateway-shortcut";
import {
  ReceiptListItemRow,
  receiptTable,
  deleteTargetLabelOf,
} from "./list-item";
import { RECEIPT_PRINT_COLUMNS, receiptPrintTotal } from "./print-columns";

export const ReceiptListContent = () => {
  const { isCanCreate, isCanUpdate, isCanDelete } = useMenuAccess(
    MENU.KAS_MASUK,
  );

  const toast = useToast();

  // Satu keadaan menyimpan baris yang akan dihapus sekaligus status terbuka
  // dialognya. Hook hapus dibuat ulang mengikuti kunci baris ini.
  const [target, setTarget] = useState<CashReceipt | null>(null);
  const deleteRow = useReceiptAction(target?.publicId ?? "");
  const listParams = useListParams({ filters: RECEIPT_FILTERS });
  const receiptList = useReceiptList(listParams);
  const isNarrowed = Boolean(listParams.search) || listParams.isFiltered;
  const print = useListExport({
    fetchPage: fetchReceiptPage,
    params: listParams,
  });

  const onDelete = () => {
    deleteRow.mutate(
      { action: "hapus" },
      {
        onSuccess: (deleted) => {
          toast.add({ title: deleted.message });
          setTarget(null);
        },
      },
    );
  };

  const onCancelDelete = () => {
    deleteRow.reset();
    setTarget(null);
  };

  return (
    <div className="pb-6">
      <PageHeader
        title={TITLE}
        subtitle={
          receiptList.totalData === undefined
            ? undefined
            : `${receiptList.totalData} kas masuk`
        }
        backHref={domainHref(MENU.FINANCE)}
        action={
          <span className="flex items-center gap-2">
            <PrintListButton
              isPending={print.isPending}
              onPrint={() => void print.onPrint()}
            />
            <CsvDownloadButton
              isPending={print.isPending}
              onDownload={() =>
                void print.onExportCsv(toCsvColumns(RECEIPT_PRINT_COLUMNS), [
                  TITLE,
                  printSubtitleOf(listParams.filters, listParams.search),
                ])
              }
            />
            {isCanCreate ? (
              <>
                <GatewayShortcut />
                <PageHeaderAdd
                  href={KAS_MASUK_CREATE_PATH}
                  label="Tambah kas masuk"
                />
              </>
            ) : null}
          </span>
        }
      />

      <ListTabs
        label="Status kas masuk"
        value={listParams.status}
        options={STATUS_TABS}
        onValueChange={(status) => listParams.onPickFilter("status", status)}
      />

      <ListToolbar
        listParams={listParams}
        searchLabel="Cari kas masuk"
        searchPlaceholder="Cari kode, pemberi, atau referensi"
        filters={[
          {
            key: "bulan",
            label: "Bulan",
            kind: "select",
            options: monthFilterOptions(),
            defaultValue: MONTH_ALL,
          },
        ]}
      />

      {/* Saat mencetak, yang dipakai lembar penuh di bawah — daftar berhalaman
          di layar ini justru akan ikut tercetak sebagian. */}
      <div className={print.rows ? "print:hidden" : undefined}>
        <DataList
          loadingShape="trailing"
          items={receiptList.items}
          getKey={(receipt) => receipt.publicId}
          label="Daftar kas masuk"
          isLoading={receiptList.isLoading}
          isRefreshing={receiptList.isRefreshing}
          error={receiptList.error}
          onRetry={receiptList.onRetry}
          emptyTitle={isNarrowed ? "Tidak ada kas masuk" : EMPTY_TITLE}
          emptyDescription={
            isNarrowed
              ? `Tidak ada kas masuk yang cocok dengan pencarian atau filter ini. Bawaannya hanya bulan berjalan. ${PERSEMBAHAN_NOTE}`
              : `${EMPTY_DESCRIPTION} ${PERSEMBAHAN_NOTE}`
          }
          onClearFilter={
            listParams.isFiltered ? listParams.onClearFilters : undefined
          }
          pagination={receiptList.pagination}
          table={receiptTable(isCanUpdate, isCanDelete ? setTarget : undefined)}
          itemNoun="kas masuk"
        >
          {(receipt) => <ReceiptListItemRow receipt={receipt} />}
        </DataList>
      </div>

      {print.error ? (
        <p role="alert" className="text-destructive px-gutter pt-3 text-body">
          Daftar gagal disiapkan untuk dicetak. Coba lagi.
        </p>
      ) : null}

      {print.rows ? (
        <PrintSheet
          title={TITLE}
          subtitle={printSubtitleOf(listParams.filters, listParams.search)}
          columns={RECEIPT_PRINT_COLUMNS}
          rows={print.rows}
          getKey={(receipt) => receipt.publicId}
          footer={`Jumlah: ${receiptPrintTotal(print.rows)}`}
        />
      ) : null}

      <RowDeleteDialog
        target={target ? { label: deleteTargetLabelOf(target) } : null}
        entity="kas masuk"
        isPending={deleteRow.isPending}
        errorMessage={deleteRow.error?.message}
        onCancel={onCancelDelete}
        onConfirm={onDelete}
      />
    </div>
  );
};
