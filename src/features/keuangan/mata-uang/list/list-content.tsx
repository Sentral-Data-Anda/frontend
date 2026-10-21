"use client";

import { useState } from "react";

import { useToast } from "@/components/common/feedback";
import {
  DataList,
  ListToolbar,
  RowDeleteDialog,
} from "@/components/common/list";
import { PageHeader, PageHeaderAdd } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useListParams } from "@/hooks/use-list-params";

import { useCurrencyList, useDeleteCurrency } from "../api";
import { MATA_UANG_CREATE_PATH } from "../model";
import type { Currency } from "../types";

import {
  CurrencyListItemRow,
  currencyTable,
  deleteTargetLabelOf,
} from "./list-item";

export const CurrencyListContent = () => {
  const { isCanCreate, isCanDelete } = useMenuAccess(MENU.CURRENCY);

  const toast = useToast();

  // Satu keadaan menyimpan baris yang akan dihapus sekaligus status terbuka
  // dialognya. Hook hapus dibuat ulang mengikuti kunci baris ini.
  const [target, setTarget] = useState<Currency | null>(null);
  const deleteRow = useDeleteCurrency(target?.code);
  const listParams = useListParams();
  const currencyList = useCurrencyList(listParams);
  const isSearched = Boolean(listParams.search);

  const onDelete = () => {
    deleteRow.mutate(undefined, {
      onSuccess: (deleted) => {
        toast.add({ title: deleted.message });
        setTarget(null);
      },
    });
  };

  const onCancelDelete = () => {
    deleteRow.reset();
    setTarget(null);
  };

  return (
    <div className="pb-6">
      <PageHeader
        title="Currency"
        subtitle={
          currencyList.totalData === undefined
            ? undefined
            : `${currencyList.totalData} mata uang`
        }
        backHref={domainHref(MENU.FINANCE)}
        action={
          isCanCreate ? (
            <PageHeaderAdd
              href={MATA_UANG_CREATE_PATH}
              label="Tambah mata uang"
            />
          ) : null
        }
      />

      <ListToolbar
        listParams={listParams}
        searchLabel="Cari mata uang"
        searchPlaceholder="Cari kode atau nama"
      />

      <DataList
        loadingShape="trailing"
        items={currencyList.items}
        getKey={(currency) => currency.code}
        label="Daftar mata uang"
        isLoading={currencyList.isLoading}
        isRefreshing={currencyList.isRefreshing}
        error={currencyList.error}
        onRetry={currencyList.onRetry}
        emptyTitle={isSearched ? "Tidak ada mata uang" : "Belum ada mata uang"}
        emptyDescription={
          isSearched
            ? "Tidak ada mata uang yang cocok dengan pencarian ini."
            : "Tambahkan mata uang yang dipakai untuk membeli dari luar negeri, mis. USD."
        }
        pagination={currencyList.pagination}
        table={currencyTable(isCanDelete ? setTarget : undefined)}
        itemNoun="mata uang"
      >
        {(currency) => <CurrencyListItemRow currency={currency} />}
      </DataList>

      <RowDeleteDialog
        target={target ? { label: deleteTargetLabelOf(target) } : null}
        entity="mata uang"
        isPending={deleteRow.isPending}
        errorMessage={deleteRow.error?.message}
        onCancel={onCancelDelete}
        onConfirm={onDelete}
      />
    </div>
  );
};
