"use client";

import Link from "next/link";

import { EmptyState } from "@/components/common/feedback";
import {
  DataList,
  DataListRow,
  ListTabs,
  ListToolbar,
} from "@/components/common/list";
import { PageHeader, PageHeaderAdd } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useListParams } from "@/hooks/use-list-params";

import { LOAN_FILTERS, useLoanList } from "../api";
import {
  DIRECTION_LABEL,
  EMPTY_DESCRIPTION,
  EMPTY_TITLE,
  NO_VIEW,
  PINJAMAN_CREATE_PATH,
  STATUS_TABS,
  TITLE,
  money,
  pinjamanHref,
} from "../model";

import { loanMeta, loanTable } from "./list-item";

const ROW_LINK =
  "focus-visible:ring-ring inline-block min-h-9 max-w-full truncate rounded-sm align-middle leading-9 underline-offset-4 outline-none hover:underline focus-visible:ring-2";

const DIRECTION_OPTIONS = [
  { value: "", label: "Semua arah" },
  { value: "BORROWED", label: DIRECTION_LABEL.BORROWED },
  { value: "LENT", label: DIRECTION_LABEL.LENT },
];

export const PinjamanListScreen = () => {
  const { isCanView, isCanCreate } = useMenuAccess(MENU.LOAN);
  const listParams = useListParams({ filters: LOAN_FILTERS });
  const loans = useLoanList(listParams);
  const isNarrowed = Boolean(listParams.search) || listParams.isFiltered;

  if (!isCanView) {
    return (
      <div className="pb-6">
        <PageHeader title={TITLE} backHref={domainHref(MENU.FINANCE)} />
        <EmptyState
          title="Anda tidak memiliki akses ke Pinjaman"
          description={NO_VIEW}
        />
      </div>
    );
  }

  return (
    <div className="pb-6">
      <PageHeader
        title={TITLE}
        subtitle={
          loans.totalData === undefined
            ? undefined
            : `${loans.totalData} pinjaman`
        }
        backHref={domainHref(MENU.FINANCE)}
        action={
          isCanCreate ? (
            <PageHeaderAdd
              href={PINJAMAN_CREATE_PATH}
              label="Tambah pinjaman"
            />
          ) : null
        }
      />

      <ListTabs
        label="Status pinjaman"
        value={listParams.status}
        options={STATUS_TABS}
        onValueChange={(status) => listParams.onPickFilter("status", status)}
      />

      <ListToolbar
        listParams={listParams}
        searchLabel="Cari pinjaman"
        searchPlaceholder="Cari kode atau nama pihak"
        filters={[
          {
            key: "arah",
            label: "Arah",
            kind: "select",
            options: DIRECTION_OPTIONS,
          },
        ]}
      />

      <DataList
        loadingShape="trailing"
        items={loans.items}
        getKey={(loan) => loan.publicId}
        label="Daftar pinjaman"
        isLoading={loans.isLoading}
        isRefreshing={loans.isRefreshing}
        error={loans.error}
        onRetry={loans.onRetry}
        emptyTitle={isNarrowed ? "Tidak ada pinjaman" : EMPTY_TITLE}
        emptyDescription={
          isNarrowed
            ? "Tidak ada pinjaman yang cocok dengan pencarian atau filter ini."
            : EMPTY_DESCRIPTION
        }
        onClearFilter={
          listParams.isFiltered ? listParams.onClearFilters : undefined
        }
        pagination={loans.pagination}
        table={loanTable()}
        itemNoun="pinjaman"
      >
        {(loan) => (
          <DataListRow
            title={
              <Link href={pinjamanHref(loan.publicId)} className={ROW_LINK}>
                {loan.counterpartyName}
              </Link>
            }
            meta={loanMeta(loan)}
            trailing={
              <span className="text-body font-semibold tabular-nums">
                {money(loan.principal)}
              </span>
            }
          />
        )}
      </DataList>
    </div>
  );
};
