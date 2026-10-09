"use client";

import { DataList, ListToolbar } from "@/components/common/list";
import { PageHeader, PageHeaderAdd } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useListParams } from "@/hooks/use-list-params";

import { useCurrencyList } from "../api";
import { MATA_UANG_CREATE_PATH } from "../model";

import { CurrencyListItemRow, currencyTable } from "./list-item";

export const CurrencyListContent = () => {
  const { isCanCreate } = useMenuAccess(MENU.CURRENCY);
  const listParams = useListParams();
  const currencyList = useCurrencyList(listParams);
  const isSearched = Boolean(listParams.search);

  return (
    <div className="pb-6">
      <PageHeader
        title="Mata Uang"
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
        table={currencyTable()}
        itemNoun="mata uang"
      >
        {(currency) => <CurrencyListItemRow currency={currency} />}
      </DataList>
    </div>
  );
};
