"use client";

import { Button } from "@/components/common/control";
import {
  DescriptionItem,
  DescriptionList,
  DescriptionSkeleton,
  PANEL_TITLE,
  Panel,
  SalaryDataBadge,
} from "@/components/common/display";
import { EmptyState } from "@/components/common/feedback";
import { FormNotFound } from "@/components/common/form";
import { StepUpDialog } from "@/components/common/overlay";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { FetchError } from "@/lib/api/fetcher";
import { formatAmount } from "@/lib/format";
import { cn } from "@/lib/utils";

import { usePayrollDetail } from "../api";
import {
  LOCKED_DESCRIPTION,
  LOCKED_TITLE,
  NO_VIEW_DESCRIPTION,
  NO_VIEW_TITLE,
  SLIP_ONE_OFF_NOTE,
  SLIP_SOURCE_NOTE,
  STEP_UP_DESCRIPTION,
  deductionsOf,
  earningsOf,
  payslipOf,
  periodLabel,
  runHref,
} from "../model";
import { useSalaryLock } from "../use-salary-lock";

import { SlipLinePanel } from "./slip-line-panel";

const TITLE = "Slip gaji";

interface PropTypes {
  code: string;
  slipCode: string;
}

export const PayslipScreen = (props: PropTypes) => {
  const { code, slipCode } = props;

  const { isCanView } = useMenuAccess(MENU.PAYROLL);
  const detail = usePayrollDetail(isCanView ? code : undefined);
  const lock = useSalaryLock(detail.error, () => void detail.refetch());
  const backHref = runHref(code);
  const run = detail.data;
  const slip = run ? payslipOf(run, slipCode) : null;
  const isNotFound =
    (detail.error instanceof FetchError && detail.error.status === 404) ||
    (Boolean(run) && slip === null);

  if (!isCanView) {
    return (
      <div className="pb-8">
        <PageHeader title={TITLE} backHref={domainHref(MENU.HR)} />

        <EmptyState title={NO_VIEW_TITLE} description={NO_VIEW_DESCRIPTION} />
      </div>
    );
  }

  if (lock.isLocked) {
    return (
      <div className="pb-8">
        <PageHeader title={TITLE} backHref={backHref} isBackPersistent />

        <EmptyState
          title={LOCKED_TITLE}
          description={LOCKED_DESCRIPTION}
          action={
            <Button type="button" onClick={lock.onAsk}>
              Masukkan password
            </Button>
          }
        />

        <StepUpDialog
          isOpen={lock.isAsking}
          onClose={lock.onClose}
          onVerified={lock.onVerified}
          description={STEP_UP_DESCRIPTION}
        />
      </div>
    );
  }

  if (isNotFound) {
    return (
      <FormNotFound
        noun="slip gaji"
        backHref={backHref}
        backLabel="Kembali ke penggajian"
      />
    );
  }

  if (!run || !slip) {
    return (
      <div className="pb-8">
        <PageHeader title={TITLE} backHref={backHref} isBackPersistent />

        {detail.error ? (
          <div role="alert">
            <EmptyState
              title="Gagal memuat slip gaji"
              description={detail.error.message}
              action={
                <Button
                  type="button"
                  variant="outline"
                  disabled={detail.isFetching}
                  onClick={() => void detail.refetch()}
                  isLoading={detail.isFetching}
                >
                  {detail.isFetching ? "Memuat…" : "Coba lagi"}
                </Button>
              }
            />
          </div>
        ) : (
          <div className="px-gutter">
            <Panel>
              <div className="px-gutter py-2">
                <DescriptionSkeleton label="Memuat slip gaji" rows={5} />
              </div>
            </Panel>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="pb-8">
      <PageHeader
        title={slip.karyawan.name}
        subtitle={`${slip.code} · ${periodLabel(run)}`}
        backHref={backHref}
        isBackPersistent
      />

      <div className="space-y-4 px-gutter pb-4">
        <SalaryDataBadge />

        <Panel label="Ringkasan slip">
          <h2 className={cn(PANEL_TITLE, "px-gutter pt-4")}>Ringkasan</h2>

          <DescriptionList className="px-gutter py-2">
            <DescriptionItem label="Karyawan">
              <span className="wrap-break-word">{slip.karyawan.name}</span>
            </DescriptionItem>

            <DescriptionItem label="Kode karyawan">
              <span className="tabular-nums">{slip.karyawan.code}</span>
            </DescriptionItem>

            <DescriptionItem label="Periode">
              <span className="tabular-nums">{periodLabel(run)}</span>
            </DescriptionItem>

            <DescriptionItem label="Gaji pokok">
              <span className="tabular-nums">
                {formatAmount(slip.basicSalary)}
              </span>
            </DescriptionItem>

            <DescriptionItem label="Bruto">
              <span className="tabular-nums">
                {formatAmount(slip.grossAmount)}
              </span>
            </DescriptionItem>

            <DescriptionItem label="Potongan">
              <span className="tabular-nums">
                {formatAmount(slip.deductionTotal)}
              </span>
            </DescriptionItem>

            <DescriptionItem label="Bersih">
              <span className="font-semibold tabular-nums">
                {formatAmount(slip.netAmount)}
              </span>
            </DescriptionItem>
          </DescriptionList>
        </Panel>

        <SlipLinePanel
          label="Tunjangan"
          lines={earningsOf(slip)}
          total={slip.grossAmount}
          totalLabel="Bruto (gaji pokok + tunjangan)"
        />

        <SlipLinePanel
          label="Potongan"
          lines={deductionsOf(slip)}
          total={slip.deductionTotal}
          totalLabel="Total potongan"
        />

        <div className="space-y-1">
          <p className="text-muted-foreground text-caption">
            {SLIP_SOURCE_NOTE}
          </p>
          <p className="text-muted-foreground text-caption">
            {SLIP_ONE_OFF_NOTE}
          </p>
        </div>
      </div>
    </div>
  );
};
