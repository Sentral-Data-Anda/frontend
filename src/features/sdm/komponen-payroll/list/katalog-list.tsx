"use client";

import { DataList, ListToolbar } from "@/components/common/list";
import { PageHeader, PageHeaderAdd } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useDdlOptions } from "@/hooks/use-ddl-options";
import { useListParams } from "@/hooks/use-list-params";

import { useKomponenPayrollList } from "../api";
import {
  ACCOUNT_LOADING,
  ACCOUNT_UNKNOWN,
  ACCOUNT_UNMAPPED,
  KATALOG_CREATE_PATH,
  KATALOG_FILTERS,
  KATALOG_LIST_PATH,
} from "../model";
import { COMPONENT_TYPE_FILTER } from "../types";
import { KomponenPayrollTabs } from "../ui";

import { katalogTable, KatalogListItemRow } from "./katalog-item";

type AccountOption = {
  id: number;
  code: string;
  name: string;
};

export const KatalogList = () => {
  const { isCanCreate, isCanUpdate } = useMenuAccess(MENU.PAYROLL_COMPONENT);
  const listParams = useListParams({ filters: KATALOG_FILTERS });
  const components = useKomponenPayrollList(listParams);
  const accounts = useDdlOptions<AccountOption>("account");
  const isSearched = Boolean(listParams.search) || listParams.isFiltered;

  // "Belum dipetakan" selama daftar akun masih terbang adalah kebohongan di
  // kolom yang menentukan apakah penggajian bisa dibayar.
  const accountLabelOf = (accountId: number | null) => {
    if (accountId === null) return ACCOUNT_UNMAPPED;
    if (accounts.isLoading) return ACCOUNT_LOADING;

    const account = accounts.rows.find((row) => row.id === accountId);

    return account ? `${account.code} — ${account.name}` : ACCOUNT_UNKNOWN;
  };

  return (
    <div className="pb-6">
      <PageHeader
        title="Komponen Payroll"
        subtitle={
          components.totalData === undefined
            ? undefined
            : `${components.totalData} komponen`
        }
        backHref={domainHref(MENU.HR)}
        action={
          isCanCreate ? (
            <PageHeaderAdd href={KATALOG_CREATE_PATH} label="Tambah komponen" />
          ) : null
        }
      />

      <KomponenPayrollTabs value={KATALOG_LIST_PATH} />

      <ListToolbar
        listParams={listParams}
        searchLabel="Cari komponen"
        searchPlaceholder="Cari nama atau kode"
        filters={[
          {
            key: "jenis",
            label: "Jenis",
            kind: "choice",
            options: COMPONENT_TYPE_FILTER,
          },
        ]}
      />

      <DataList
        items={components.items}
        getKey={(component) => component.code}
        label="Daftar komponen payroll"
        isLoading={components.isLoading}
        isRefreshing={components.isRefreshing}
        error={components.error}
        onRetry={components.onRetry}
        emptyTitle={
          isSearched ? "Tidak ada komponen" : "Belum ada komponen payroll"
        }
        emptyDescription={
          isSearched
            ? "Tidak ada komponen yang cocok."
            : "Tambahkan tunjangan dan potongan yang dipakai gereja, lalu tetapkan ke karyawan."
        }
        onClearFilter={
          listParams.isFiltered ? listParams.onClearFilters : undefined
        }
        pagination={components.pagination}
        table={katalogTable(isCanUpdate, accountLabelOf)}
        loadingShape="trailing"
        itemNoun="komponen"
      >
        {(component) => (
          <KatalogListItemRow component={component} isCanUpdate={isCanUpdate} />
        )}
      </DataList>
    </div>
  );
};
