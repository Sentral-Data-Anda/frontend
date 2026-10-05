"use client";

import { ArrowUpFromLine, FileCheck, Lightbulb } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/common/control";
import { KpiCell, KpiStrip } from "@/components/common/dashboard";
import { DescriptionSkeleton, Panel } from "@/components/common/display";
import { EmptyState, useToast } from "@/components/common/feedback";
import {
  FormAlert,
  FormConfirmDialog,
  FormNotFound,
  useFormConfirm,
} from "@/components/common/form";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useBoolean } from "@/hooks/use-boolean";
import { useListReturn } from "@/hooks/use-list-return";
import { FetchError } from "@/lib/api/fetcher";

import { useProgramAction, useProgramDetail } from "../api";
import {
  PROGRAM_LIST_PATH,
  amountText,
  cancelledTitleOf,
  ceilingExceededMessage,
  ceilingMissingMessage,
  isCeilingExceeded,
  isCeilingMissing,
  programDeleteText,
  programSubmitText,
  programWithdrawText,
  rejectedMessageOf,
  rejectedStepOf,
  rejectedTitleOf,
  remainingBeforeOf,
} from "../model";
import type { ProgramAction } from "../types";
import { ProgramStatusBadge } from "../ui";

import { ApprovalPanel } from "./approval-panel";
import { CancelDialog } from "./cancel-dialog";
import { CeilingPanel } from "./ceiling-panel";
import { FailureAlert } from "./failure-alert";
import { ItemList } from "./item-list";
import { ProgramActions } from "./program-actions";
import { RealisationPanel } from "./realisation-panel";
import { SummaryPanel } from "./summary-panel";

const TITLE = "Program";

const FAILURE_TITLE: Record<ProgramAction, string> = {
  pengajuan: "Usulan belum diajukan.",
  tarik: "Pengajuan belum ditarik.",
  hapus: "Usulan belum dihapus.",
};

interface PropTypes {
  publicId: string;
}

export const ProgramDetailScreen = (props: PropTypes) => {
  const { publicId } = props;

  const router = useRouter();
  const toast = useToast();
  const { isCanView } = useMenuAccess(MENU.PROGRAM);
  const listReturn = useListReturn(PROGRAM_LIST_PATH);
  const detail = useProgramDetail(isCanView ? publicId : undefined);
  const action = useProgramAction(publicId);
  const confirm = useFormConfirm();
  const isCancelOpen = useBoolean();
  const [pickAction, setPickAction] = useState<ProgramAction>("pengajuan");
  const program = detail.data;
  const isNotFound =
    detail.error instanceof FetchError && detail.error.status === 404;
  const rejected = rejectedStepOf(program?.approval ?? null);
  const isExceeded = program ? isCeilingExceeded(program.ceiling) : false;
  const blockedReason = !program
    ? null
    : isCeilingMissing(program.ceiling)
      ? ceilingMissingMessage(program.budgetYear.label)
      : isExceeded
        ? ceilingExceededMessage(
            remainingBeforeOf(program.ceiling, program.proposedAmount),
          )
        : null;

  const onPick = (next: ProgramAction) => {
    setPickAction(next);
    confirm.onOpen(next === "pengajuan" ? "update" : "delete");
  };

  const onRun = (next: ProgramAction) =>
    action.mutate(next, {
      onSuccess: (response) => {
        toast.add({ title: response.message });
        if (next === "hapus") router.replace(listReturn);
      },
    });

  const onCancelled = (message: string) => {
    isCancelOpen.onFalse();
    toast.add({ title: message });
  };

  if (!isCanView) {
    return (
      <div className="pb-8">
        <PageHeader title={TITLE} backHref={domainHref(MENU.ANGGARAN)} />

        <EmptyState
          title="Anda tidak memiliki akses ke Program"
          description="Hubungi administrator bila Anda memerlukan akses ini."
        />
      </div>
    );
  }

  if (isNotFound) {
    return (
      <FormNotFound
        noun="program"
        backHref={listReturn}
        backLabel="Kembali ke Program"
      />
    );
  }

  if (!program) {
    return (
      <div className="pb-8">
        <PageHeader title={TITLE} backHref={listReturn} isBackPersistent />

        {detail.error ? (
          <div role="alert">
            <EmptyState
              title="Gagal memuat program"
              description={detail.error.message}
              action={
                <Button
                  type="button"
                  variant="outline"
                  disabled={detail.isFetching}
                  onClick={() => void detail.refetch()}
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
                <DescriptionSkeleton label="Memuat program" rows={5} />
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
        title={program.name}
        subtitle={[program.code, program.bapel?.name]
          .filter(Boolean)
          .join(" · ")}
        backHref={listReturn}
        isBackPersistent
        action={<ProgramStatusBadge program={program} />}
      />

      <div className="space-y-4 px-gutter pb-4">
        {rejected ? (
          <FormAlert
            tone="warning"
            title={rejectedTitleOf(rejected)}
            message={rejectedMessageOf(rejected)}
          />
        ) : null}

        {program.cancelReason ? (
          <FormAlert
            tone="info"
            title={cancelledTitleOf(program)}
            message={program.cancelReason}
          />
        ) : null}

        <KpiStrip label="Angka program">
          <KpiCell
            label="Diusulkan"
            icon={Lightbulb}
            value={amountText(program.proposedAmount)}
            hint={program.budgetYear.label}
          />
          <KpiCell
            label="Dicairkan ke komisi"
            icon={ArrowUpFromLine}
            tone="secondary"
            value={amountText(program.ceiling.disbursed)}
            hint="Sudah dibayar lewat Kas Keluar"
          />
          <KpiCell
            label="Dilaporkan ke program ini"
            icon={FileCheck}
            tone="success"
            value={amountText(program.reportedUsage.total)}
            hint="Dari laporan yang sudah disetujui"
          />
        </KpiStrip>

        <CeilingPanel
          ceiling={program.ceiling}
          bapelId={program.bapelId}
          yearLabel={program.budgetYear.label}
          proposedAmount={program.proposedAmount}
        />

        <ProgramActions
          program={program}
          pendingAction={action.isPending ? (action.variables ?? null) : null}
          isSubmitBlocked={isExceeded}
          blockedReason={blockedReason}
          onPick={onPick}
          onCancel={isCancelOpen.onTrue}
        />

        {action.error ? (
          <FailureAlert
            title={FAILURE_TITLE[action.variables ?? pickAction]}
            error={action.error}
            target={{ bapelId: program.bapelId, year: program.year }}
          />
        ) : null}

        {program.approval ? (
          <ApprovalPanel approval={program.approval} />
        ) : null}

        <SummaryPanel program={program} />

        <ItemList items={program.items} />

        <RealisationPanel
          usage={program.reportedUsage}
          disbursed={program.ceiling.disbursed}
          bapelId={program.bapelId}
        />
      </div>

      <FormConfirmDialog
        confirm={confirm}
        noun="program"
        descriptions={{
          update: programSubmitText,
          delete:
            pickAction === "tarik"
              ? programWithdrawText
              : programDeleteText(program),
        }}
        onSave={() => onRun("pengajuan")}
        onDelete={() => onRun(pickAction)}
      />

      <CancelDialog
        publicId={program.publicId}
        heldAmount={program.proposedAmount}
        isOpen={isCancelOpen.value}
        onClose={isCancelOpen.onFalse}
        onCancelled={onCancelled}
      />
    </div>
  );
};
