"use client";

import {
  Armchair,
  HandCoins,
  PackageOpen,
  Plus,
  ReceiptText,
} from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/common/control";
import { Panel } from "@/components/common/display";
import { EmptyState } from "@/components/common/feedback";
import { DataList, ListTabs, ListToolbar } from "@/components/common/list";
import { PageHeader, PageHeaderAdd } from "@/components/layout";
import { MENU, domainHref, menuHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useDdlOptions } from "@/hooks/use-ddl-options";
import { useListParams } from "@/hooks/use-list-params";
import { monthOptions } from "@/lib/date";
import { cn } from "@/lib/utils";

import { JOURNAL_FILTERS, useJournalList } from "../api";
import {
  EMPTY_DESCRIPTION,
  EMPTY_TITLE,
  JURNAL_CREATE_PATH,
  NO_ACCOUNT_DESCRIPTION,
  NO_ACCOUNT_TITLE,
  POSTING_LINKS,
  POSTING_NOTE,
  STATUS_TABS,
} from "../model";

import { JournalListItemRow, journalTable } from "./list-item";

type AccountRow = { id: number; code: string; name: string };

const POSTING_ICON = {
  persembahan: HandCoins,
  aset: Armchair,
  pengadaan: ReceiptText,
  persediaan: PackageOpen,
} as const;

export const JournalListContent = () => {
  const { isCanCreate } = useMenuAccess(MENU.JOURNAL_ENTRY);
  const accountAccess = useMenuAccess(MENU.CHART_OF_ACCOUNT);
  const listParams = useListParams({ filters: JOURNAL_FILTERS });
  const journalList = useJournalList(listParams);
  const accounts = useDdlOptions<AccountRow>(
    "account",
    "id",
    listParams.filters.akun,
  );
  const isNarrowed = Boolean(listParams.search) || listParams.isFiltered;
  const isBookEmpty =
    !isNarrowed &&
    !journalList.isLoading &&
    !journalList.error &&
    journalList.items?.length === 0;
  const isAccountMissing =
    isBookEmpty && !accounts.isLoading && accounts.rows.length === 0;
  const accountFilterOptions = [
    { value: "", label: "Semua akun" },
    ...accounts.rows.map((row) => ({
      value: String(row.id),
      label: `${row.code} — ${row.name}`,
    })),
  ];

  return (
    <div className="pb-6">
      <PageHeader
        title="Jurnal"
        subtitle={
          isBookEmpty || journalList.totalData === undefined
            ? undefined
            : `${journalList.totalData} entri`
        }
        backHref={domainHref(MENU.FINANCE)}
        action={
          isCanCreate && !isBookEmpty ? (
            <PageHeaderAdd
              href={JURNAL_CREATE_PATH}
              label="Tambah entri jurnal"
            />
          ) : null
        }
      />

      {isCanCreate ? (
        <Panel className="mx-gutter mb-4">
          <div className="space-y-3 px-gutter py-3">
            <p className="text-muted-foreground text-body">{POSTING_NOTE}</p>

            {/* Membungkus, tidak menggulir: empat tombol tidak muat berjajar
                di 390px, dan baris yang menggulir ke samping menyembunyikan
                tombol terakhirnya di belakang tepi layar. */}
            <div className="flex flex-wrap gap-2">
              {POSTING_LINKS.map((entry) => {
                const Icon = POSTING_ICON[entry.key];

                return (
                  <Link
                    key={entry.key}
                    href={entry.href}
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      "cursor-pointer",
                    )}
                  >
                    <Icon aria-hidden />
                    {entry.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </Panel>
      ) : null}

      {isBookEmpty ? null : (
        <>
          <ListTabs
            label="Status entri"
            value={listParams.status}
            options={STATUS_TABS}
            onValueChange={(status) =>
              listParams.onPickFilter("status", status)
            }
          />

          <ListToolbar
            listParams={listParams}
            searchLabel="Cari entri jurnal"
            searchPlaceholder="Cari kode atau keterangan"
            filters={[
              {
                key: "bulan",
                label: "Bulan",
                kind: "select",
                options: [
                  { value: "", label: "Semua bulan tahun ini" },
                  ...monthOptions(),
                ],
              },
              {
                key: "akun",
                label: "Akun",
                kind: "select",
                options: accountFilterOptions,
              },
            ]}
          />
        </>
      )}

      {isBookEmpty ? (
        <EmptyState
          title={isAccountMissing ? NO_ACCOUNT_TITLE : EMPTY_TITLE}
          description={
            isAccountMissing ? NO_ACCOUNT_DESCRIPTION : EMPTY_DESCRIPTION
          }
          className="py-12"
          action={
            isAccountMissing ? (
              accountAccess.isCanView ? (
                <Link
                  href={menuHref(MENU.FINANCE, MENU.CHART_OF_ACCOUNT)}
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "cursor-pointer",
                  )}
                >
                  Buat akun dulu
                </Link>
              ) : null
            ) : isCanCreate ? (
              <Link
                href={JURNAL_CREATE_PATH}
                className={cn(buttonVariants(), "cursor-pointer")}
              >
                <Plus aria-hidden />
                Tambah entri
              </Link>
            ) : null
          }
        />
      ) : (
        <DataList
          loadingShape="trailing"
          items={journalList.items}
          getKey={(entry) => entry.publicId}
          label="Daftar entri jurnal"
          isLoading={journalList.isLoading}
          isRefreshing={journalList.isRefreshing}
          error={journalList.error}
          onRetry={journalList.onRetry}
          emptyTitle="Tidak ada entri jurnal"
          emptyDescription="Tidak ada entri jurnal yang cocok dengan pencarian atau filter ini."
          onClearFilter={
            listParams.isFiltered ? listParams.onClearFilters : undefined
          }
          pagination={journalList.pagination}
          table={journalTable()}
          itemNoun="entri"
        >
          {(entry) => <JournalListItemRow entry={entry} />}
        </DataList>
      )}
    </div>
  );
};
