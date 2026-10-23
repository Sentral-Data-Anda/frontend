"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/common/control";
import { SalaryDataBadge } from "@/components/common/display";
import { EmptyState, useToast } from "@/components/common/feedback";
import {
  DataList,
  ListTabs,
  ListToolbar,
  RowDeleteDialog,
} from "@/components/common/list";
import { StepUpDialog } from "@/components/common/overlay";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useBoolean } from "@/hooks/use-boolean";
import { useListParams, type ListFilterSchema } from "@/hooks/use-list-params";

import { usePayrollList, useDeletePayroll } from "../api";
import {
  EMPTY_DESCRIPTION,
  EMPTY_TITLE,
  FILTERED_DESCRIPTION,
  LOCKED_DESCRIPTION,
  LOCKED_TITLE,
  STATUS_TABS,
  STEP_UP_DESCRIPTION,
  runHref,
  yearOptions,
} from "../model";
import type { PayrollRun } from "../types";
import { useSalaryLock } from "../use-salary-lock";

import {
  PayrollListItem,
  payrollTable,
  deleteTargetLabelOf,
} from "./list-item";
import { OpenPeriodDialog } from "./open-period-dialog";

const LIST_FILTERS = { tahun: { api: "year" } } satisfies ListFilterSchema;

const YEAR_FILTER_OPTIONS = [
  { value: "", label: "Semua tahun" },
  ...yearOptions(),
];

export const PayrollListContent = () => {
  const router = useRouter();
  const toast = useToast();
  const { isCanCreate, isCanDelete } = useMenuAccess(MENU.PAYROLL);

  // Satu keadaan menyimpan baris yang akan dihapus sekaligus status terbuka
  // dialognya. Hook hapus dibuat ulang mengikuti kunci baris ini.
  const [target, setTarget] = useState<PayrollRun | null>(null);
  const deleteRow = useDeletePayroll(target?.code ?? "");
  const listParams = useListParams({ filters: LIST_FILTERS });
  const runs = usePayrollList(listParams);
  const lock = useSalaryLock(runs.error, runs.onRetry);
  const isOpening = useBoolean();
  const isNarrowed = listParams.isFiltered || Boolean(listParams.status);

  const onOpened = (code: string) => {
    isOpening.onFalse();
    toast.add({ title: "Berhasil Membuka Penggajian" });
    router.push(runHref(code));
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
        title="Payroll"
        subtitle={
          runs.totalData === undefined
            ? undefined
            : `${runs.totalData} periode penggajian`
        }
        backHref={domainHref(MENU.HR)}
        action={
          isCanCreate ? (
            <Button type="button" onClick={isOpening.onTrue}>
              Buka periode
            </Button>
          ) : null
        }
      />

      <div className="px-gutter pb-3">
        <SalaryDataBadge />
      </div>

      {lock.isLocked ? (
        <EmptyState
          title={LOCKED_TITLE}
          description={LOCKED_DESCRIPTION}
          action={
            <Button type="button" onClick={lock.onAsk}>
              Masukkan password
            </Button>
          }
        />
      ) : (
        <>
          <ListTabs
            label="Status penggajian"
            value={listParams.status}
            options={STATUS_TABS}
            onValueChange={(status) =>
              listParams.onPickFilter("status", status)
            }
          />

          <ListToolbar
            listParams={listParams}
            filters={[
              {
                key: "tahun",
                label: "Tahun",
                kind: "select",
                options: YEAR_FILTER_OPTIONS,
              },
            ]}
          />

          <DataList
            loadingShape="trailing"
            items={runs.items}
            getKey={(run) => run.code}
            label="Daftar periode penggajian"
            isLoading={runs.isLoading}
            isRefreshing={runs.isRefreshing}
            error={runs.error}
            onRetry={runs.onRetry}
            emptyTitle={isNarrowed ? "Tidak ada penggajian" : EMPTY_TITLE}
            emptyDescription={
              isNarrowed ? FILTERED_DESCRIPTION : EMPTY_DESCRIPTION
            }
            onClearFilter={
              listParams.isFiltered ? listParams.onClearFilters : undefined
            }
            pagination={runs.pagination}
            table={payrollTable(isCanDelete ? setTarget : undefined)}
            itemNoun="periode penggajian"
          >
            {(run) => <PayrollListItem run={run} />}
          </DataList>
        </>
      )}

      <OpenPeriodDialog
        isOpen={isOpening.value}
        onClose={isOpening.onFalse}
        onOpened={onOpened}
      />

      <StepUpDialog
        isOpen={lock.isAsking}
        onClose={lock.onClose}
        onVerified={lock.onVerified}
        description={STEP_UP_DESCRIPTION}
      />

      <RowDeleteDialog
        target={target ? { label: deleteTargetLabelOf(target) } : null}
        entity="penggajian"
        isPending={deleteRow.isPending}
        errorMessage={deleteRow.error?.message}
        onCancel={onCancelDelete}
        onConfirm={onDelete}
      />
    </div>
  );
};
