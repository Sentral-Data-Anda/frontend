"use client";

import Link from "next/link";
import { useState } from "react";

import { Button, buttonVariants } from "@/components/common/control";
import { Panel } from "@/components/common/display";
import { EmptyState, useToast } from "@/components/common/feedback";
import { FormAlert } from "@/components/common/form";
import {
  DataList,
  ListTabs,
  ListToolbar,
  RowDeleteDialog,
} from "@/components/common/list";
import { PageHeader, PageHeaderAdd } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { TaggedTotal } from "@/features/anggaran/shared";
import { useMenuAccess } from "@/features/auth";
import { useBoolean } from "@/hooks/use-boolean";
import { useDdlOptions } from "@/hooks/use-ddl-options";
import { useListParams } from "@/hooks/use-list-params";

import {
  useAllocationList,
  useBudgetSetting,
  useDeleteAllocation,
} from "../api";
import {
  DISBURSED_PANEL_LABEL,
  EMPTY_DESCRIPTION,
  EMPTY_TITLE,
  LIST_FILTERS,
  PAGU_CREATE_PATH,
  SETTING_MISSING_MESSAGE,
  SETTING_MISSING_TITLE,
  UNTAGGED_HINT,
  UNTAGGED_LABEL,
  pickYear,
  taggedParts,
  untaggedOf,
  yearLabelOf,
  yearTabOptions,
} from "../model";
import type { BudgetAllocation } from "../types";

import { BudgetYearDialog } from "./budget-year-dialog";
import {
  AllocationListItem,
  allocationTable,
  deleteTargetLabelOf,
} from "./list-item";

const TITLE = "Budget";

export const AllocationListContent = () => {
  const { isCanCreate, isCanUpdate, isCanDelete } = useMenuAccess(MENU.BUDGET);

  // Satu keadaan menyimpan baris yang akan dihapus sekaligus status terbuka
  // dialognya. Hook hapus dibuat ulang mengikuti kunci baris ini.
  const [target, setTarget] = useState<BudgetAllocation | null>(null);
  const deleteRow = useDeleteAllocation(target?.publicId);
  const toast = useToast();
  const isDialogOpen = useBoolean();
  const listParams = useListParams({ filters: LIST_FILTERS });
  const setting = useBudgetSetting();
  const year = pickYear(listParams.filters.tahun, setting.data);
  const allocationList = useAllocationList({
    ...listParams,
    apiFilters: { ...listParams.apiFilters, year },
  });
  const bapels = useDdlOptions("bapel", "id", listParams.filters.komisi);
  const items = allocationList.items;
  const isNarrowed = Boolean(listParams.search || listParams.filters.komisi);
  const isEmpty =
    !allocationList.isLoading && !allocationList.error && items?.length === 0;
  const isSettingMissing = setting.data?.startMonth === null;
  const years = setting.data?.budgetYears ?? [];
  const yearLabel = yearLabelOf(years, year);

  const onSaved = () => {
    isDialogOpen.onFalse();
    toast.add({ title: "Tahun pelayanan disimpan." });
  };

  const onClearNarrow = () =>
    listParams.onApplyFilters({ komisi: "", search: "" });

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
        title={TITLE}
        subtitle={
          allocationList.totalData === undefined
            ? yearLabel || undefined
            : `${yearLabel} · ${allocationList.totalData} pagu`
        }
        backHref={domainHref(MENU.BUDGETING)}
        action={
          <div className="flex shrink-0 items-center gap-2">
            {isCanUpdate ? (
              <Button
                type="button"
                variant="outline"
                onClick={isDialogOpen.onTrue}
              >
                Tahun pelayanan
              </Button>
            ) : null}

            {isCanCreate ? (
              <PageHeaderAdd href={PAGU_CREATE_PATH} label="Tambah pagu" />
            ) : null}
          </div>
        }
      />

      {isSettingMissing ? (
        <div className="space-y-2 px-gutter pb-4">
          <FormAlert
            tone="warning"
            title={SETTING_MISSING_TITLE}
            message={SETTING_MISSING_MESSAGE}
          />

          {isCanUpdate ? (
            <Button
              type="button"
              variant="outline"
              onClick={isDialogOpen.onTrue}
            >
              Pilih bulan mulai
            </Button>
          ) : null}
        </div>
      ) : null}

      <ListTabs
        label="Tahun pelayanan"
        value={year}
        options={yearTabOptions(years)}
        onValueChange={(value) => listParams.onPickFilter("tahun", value)}
      />

      <ListToolbar
        listParams={listParams}
        searchLabel="Cari badan pelayanan"
        searchPlaceholder="Cari nama badan pelayanan"
        filters={[
          {
            key: "komisi",
            label: "Badan pelayanan",
            kind: "select",
            options: [
              { value: "", label: "Semua badan pelayanan" },
              ...bapels.options,
            ],
          },
        ]}
      />

      {isEmpty && !isNarrowed ? (
        <EmptyState
          title={EMPTY_TITLE}
          description={EMPTY_DESCRIPTION}
          action={
            isCanCreate ? (
              <Link
                href={PAGU_CREATE_PATH}
                className={buttonVariants({ variant: "outline" })}
              >
                Tambah pagu
              </Link>
            ) : null
          }
          className="py-12"
        />
      ) : (
        <DataList
          loadingShape="trailing"
          items={items}
          getKey={(row) => row.publicId}
          label="Daftar pagu anggaran"
          isLoading={allocationList.isLoading || setting.isLoading}
          isRefreshing={allocationList.isRefreshing}
          error={allocationList.error}
          onRetry={allocationList.onRetry}
          emptyTitle="Tidak ada pagu anggaran"
          emptyDescription="Tidak ada pagu anggaran yang cocok dengan filter ini."
          onClearFilter={isNarrowed ? onClearNarrow : undefined}
          pagination={allocationList.pagination}
          table={allocationTable(
            isCanUpdate,
            isCanDelete ? setTarget : undefined,
          )}
          itemNoun="badan pelayanan"
        >
          {(row) => <AllocationListItem row={row} />}
        </DataList>
      )}

      {items && items.length > 0 ? (
        <div className="px-gutter pt-6">
          <Panel>
            <div className="px-gutter py-3">
              <h2 className="mb-1 text-title font-semibold">
                {DISBURSED_PANEL_LABEL}
              </h2>

              <TaggedTotal
                label={DISBURSED_PANEL_LABEL}
                parts={taggedParts(items)}
                untaggedLabel={UNTAGGED_LABEL}
                untagged={untaggedOf(items)}
                untaggedHint={UNTAGGED_HINT}
                renderPart={(part) => (
                  <Link
                    href={part.href ?? "#"}
                    className="min-w-0 truncate hover:underline"
                  >
                    {part.label}
                  </Link>
                )}
              />
            </div>
          </Panel>
        </div>
      ) : null}

      {setting.data ? (
        <BudgetYearDialog
          isOpen={isDialogOpen.value}
          setting={setting.data}
          onClose={isDialogOpen.onFalse}
          onSaved={onSaved}
        />
      ) : null}

      <RowDeleteDialog
        target={target ? { label: deleteTargetLabelOf(target) } : null}
        entity="badan pelayanan"
        isPending={deleteRow.isPending}
        errorMessage={deleteRow.error?.message}
        onCancel={onCancelDelete}
        onConfirm={onDelete}
      />
    </div>
  );
};
