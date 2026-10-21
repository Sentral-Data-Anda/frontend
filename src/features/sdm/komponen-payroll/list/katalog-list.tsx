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
import { useDdlOptions } from "@/hooks/use-ddl-options";
import { useListParams } from "@/hooks/use-list-params";

import { useDeleteKomponenPayroll, useKomponenPayrollList } from "../api";
import {
  ACCOUNT_LOADING,
  ACCOUNT_UNKNOWN,
  ACCOUNT_UNMAPPED,
  KATALOG_CREATE_PATH,
  KATALOG_FILTERS,
  KATALOG_LIST_PATH,
} from "../model";
import { COMPONENT_TYPE_FILTER, type KomponenPayroll } from "../types";
import { KomponenPayrollTabs } from "../ui";

import {
  deleteTargetLabelOf,
  katalogTable,
  KatalogListItemRow,
} from "./katalog-item";

type AccountOption = {
  id: number;
  code: string;
  name: string;
};

export const KatalogList = () => {
  const { isCanCreate, isCanUpdate, isCanDelete } = useMenuAccess(
    MENU.PAYROLL_COMPONENT,
  );

  const toast = useToast();

  // Satu keadaan menyimpan baris yang akan dihapus sekaligus status terbuka
  // dialognya. Hook hapus dibuat ulang mengikuti kunci baris ini.
  const [target, setTarget] = useState<KomponenPayroll | null>(null);
  const deleteRow = useDeleteKomponenPayroll(target?.code);
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
        title="Payroll Component"
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
        table={katalogTable(
          isCanUpdate,
          accountLabelOf,
          isCanDelete ? setTarget : undefined,
        )}
        loadingShape="trailing"
        itemNoun="komponen"
      >
        {(component) => <KatalogListItemRow component={component} />}
      </DataList>

      <RowDeleteDialog
        target={target ? { label: deleteTargetLabelOf(target) } : null}
        entity="komponen"
        isPending={deleteRow.isPending}
        errorMessage={deleteRow.error?.message}
        onCancel={onCancelDelete}
        onConfirm={onDelete}
      />
    </div>
  );
};
