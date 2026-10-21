"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { buttonVariants } from "@/components/common/control";
import { EmptyState, useToast } from "@/components/common/feedback";
import {
  DataList,
  ListToolbar,
  RowDeleteDialog,
} from "@/components/common/list";
import { PageHeader, PageHeaderAdd } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useListParams } from "@/hooks/use-list-params";
import { cn } from "@/lib/utils";

import { ACCOUNT_FILTERS, useAccountList, useDeleteAccount } from "../api";
import {
  AKUN_CREATE_PATH,
  EMPTY_DESCRIPTION,
  EMPTY_TITLE,
  accountRows,
} from "../model";
import {
  ACCOUNT_STATUS_FILTER,
  ACCOUNT_TYPE_FILTER,
  type AccountTreeRow,
} from "../types";

import {
  AccountListItemRow,
  accountTable,
  deleteTargetLabelOf,
} from "./list-item";

export const AccountListContent = () => {
  const { isCanCreate, isCanUpdate, isCanDelete } = useMenuAccess(
    MENU.CHART_OF_ACCOUNT,
  );

  const toast = useToast();

  // Satu keadaan menyimpan baris yang akan dihapus sekaligus status terbuka
  // dialognya. Hook hapus dibuat ulang mengikuti kunci baris ini.
  const [target, setTarget] = useState<AccountTreeRow | null>(null);
  const deleteRow = useDeleteAccount(target?.code);
  const listParams = useListParams({ limit: 50, filters: ACCOUNT_FILTERS });
  const accountList = useAccountList(listParams);
  const isNarrowed = Boolean(listParams.search) || listParams.isFiltered;
  const rows = accountRows(accountList.items ?? [], isNarrowed);
  const isChartEmpty =
    !isNarrowed &&
    !accountList.isLoading &&
    !accountList.error &&
    accountList.items?.length === 0;

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
        title="Chart of Account"
        subtitle={
          isChartEmpty || accountList.totalData === undefined
            ? undefined
            : `${accountList.totalData} akun`
        }
        backHref={domainHref(MENU.FINANCE)}
        action={
          isCanCreate && !isChartEmpty ? (
            <PageHeaderAdd href={AKUN_CREATE_PATH} label="Tambah akun" />
          ) : null
        }
      />

      {isChartEmpty ? null : (
        <ListToolbar
          listParams={listParams}
          searchLabel="Cari akun"
          searchPlaceholder="Cari kode atau nama"
          filters={[
            {
              key: "tipe",
              label: "Tipe",
              kind: "select",
              options: ACCOUNT_TYPE_FILTER,
            },
            {
              key: "aktif",
              label: "Status",
              kind: "choice",
              options: ACCOUNT_STATUS_FILTER,
            },
          ]}
        />
      )}

      {isChartEmpty ? (
        <EmptyState
          title={EMPTY_TITLE}
          description={EMPTY_DESCRIPTION}
          className="py-12"
          action={
            isCanCreate ? (
              <Link
                href={AKUN_CREATE_PATH}
                className={cn(buttonVariants(), "cursor-pointer")}
              >
                <Plus aria-hidden />
                Tambah akun
              </Link>
            ) : null
          }
        />
      ) : (
        <DataList
          items={accountList.items === undefined ? undefined : rows}
          getKey={(account) => account.code}
          label="Daftar akun"
          isLoading={accountList.isLoading}
          isRefreshing={accountList.isRefreshing}
          error={accountList.error}
          onRetry={accountList.onRetry}
          emptyTitle="Tidak ada akun"
          emptyDescription="Tidak ada akun yang cocok dengan pencarian atau filter ini."
          onClearFilter={
            listParams.isFiltered ? listParams.onClearFilters : undefined
          }
          pagination={accountList.pagination}
          table={accountTable(isCanUpdate, isCanDelete ? setTarget : undefined)}
          itemNoun="akun"
        >
          {(account) => <AccountListItemRow account={account} />}
        </DataList>
      )}

      <RowDeleteDialog
        target={target ? { label: deleteTargetLabelOf(target) } : null}
        entity="akun"
        isPending={deleteRow.isPending}
        errorMessage={deleteRow.error?.message}
        onCancel={onCancelDelete}
        onConfirm={onDelete}
      />
    </div>
  );
};
