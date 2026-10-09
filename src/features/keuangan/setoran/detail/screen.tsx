"use client";

import Link from "next/link";
import { useState } from "react";

import { Button, buttonVariants } from "@/components/common/control";
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
import { revealField } from "@/lib/form-error";
import { formatDate } from "@/lib/format";

import { useTransferAction, useTransferDetail } from "../api";
import {
  CANCEL_TEXT,
  CANCELLED_NOTE,
  POST_TEXT,
  TRANSFER_INFO,
  TRANSFER_LIST_PATH,
  fixLinkOf,
  isReloadNeeded,
  transferPathOf,
} from "../model";
import type { TransferAction } from "../types";
import { TransferStatusBadge } from "../ui";

import { SummaryPanel } from "./summary-panel";
import { TransferActions } from "./transfer-actions";

const TITLE = "Bank Deposit";

const REASON_FIELD = "cancel-reason";

const FAILURE_TITLE: Record<TransferAction, string> = {
  setor: "Setoran belum disetor.",
  batal: "Setoran belum dibatalkan.",
};

interface PropTypes {
  code: string;
}

export const TransferDetailScreen = (props: PropTypes) => {
  const { code } = props;

  const toast = useToast();
  const { isCanView, isCanCreate, isCanDelete } = useMenuAccess(
    MENU.BANK_DEPOSIT,
  );
  const journalAccess = useMenuAccess(MENU.JOURNAL_ENTRY);
  const listReturn = useListReturn(TRANSFER_LIST_PATH);
  const detail = useTransferDetail(isCanView ? code : undefined);
  const action = useTransferAction(code);
  const confirm = useFormConfirm();
  const isReasonMissing = useBoolean();
  const [reason, setReason] = useState("");
  const transfer = detail.data;
  const isNotFound =
    detail.error instanceof FetchError && detail.error.status === 404;
  const failure = action.error;
  const fixLink = fixLinkOf(failure);

  const onReasonChange = (next: string) => {
    setReason(next);
    isReasonMissing.onFalse();
  };

  const onPick = (next: TransferAction) => {
    if (next === "setor") {
      confirm.onOpen("update");
      return;
    }
    if (reason.trim()) {
      confirm.onOpen("delete");
      return;
    }
    isReasonMissing.onTrue();
    revealField(REASON_FIELD);
  };

  const onRun = (next: TransferAction) =>
    action.mutate(
      next === "batal"
        ? { action: next, reason: reason.trim() }
        : { action: next },
      { onSuccess: (response) => toast.add({ title: response.message }) },
    );

  if (!isCanView) {
    return (
      <div className="pb-8">
        <PageHeader title={TITLE} backHref={domainHref(MENU.FINANCE)} />
        <EmptyState
          title="Anda tidak memiliki akses ke Bank Deposit"
          description="Hubungi administrator bila Anda memang seharusnya memegang akses ini."
        />
      </div>
    );
  }

  if (isNotFound) {
    return (
      <FormNotFound
        noun="setoran"
        backHref={listReturn}
        backLabel="Kembali ke Setoran"
      />
    );
  }

  if (!transfer) {
    return (
      <div className="pb-8">
        <PageHeader title={TITLE} backHref={listReturn} isBackPersistent />

        {detail.error ? (
          <div role="alert">
            <EmptyState
              title="Gagal memuat setoran"
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
                <DescriptionSkeleton label="Memuat setoran" rows={5} />
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
        title={transferPathOf(transfer)}
        subtitle={`${transfer.code} · ${formatDate(transfer.transferDate)}`}
        backHref={listReturn}
        isBackPersistent
        action={<TransferStatusBadge status={transfer.status} />}
      />

      <div className="space-y-4 px-gutter pb-4">
        <SummaryPanel
          transfer={transfer}
          isJournalLinked={journalAccess.isCanView}
        />

        {transfer.status === "CANCELLED" ? (
          <FormAlert
            tone="warning"
            title="Setoran dibatalkan"
            message={CANCELLED_NOTE}
          />
        ) : (
          <p className="text-muted-foreground text-body">{TRANSFER_INFO}</p>
        )}

        <TransferActions
          transfer={transfer}
          isCanCreate={isCanCreate}
          isCanDelete={isCanDelete}
          reason={reason}
          isReasonMissing={isReasonMissing.value}
          pendingAction={action.isPending ? action.variables.action : null}
          onReasonChange={onReasonChange}
          onPick={onPick}
        />

        {failure ? (
          <div className="space-y-3">
            <FormAlert
              title={FAILURE_TITLE[action.variables?.action ?? "setor"]}
              message={failure.message}
            />

            {fixLink ? (
              <Link
                href={fixLink.href}
                className={buttonVariants({ variant: "outline" })}
              >
                {fixLink.label}
              </Link>
            ) : null}

            {isReloadNeeded(failure) ? (
              <p className="text-muted-foreground text-body">
                Bulan itu ditutup tepat saat setoran ini diproses. Muat ulang
                halaman ini, lalu coba lagi.
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <FormConfirmDialog
        confirm={confirm}
        noun="setoran"
        descriptions={{ update: POST_TEXT, delete: CANCEL_TEXT }}
        onSave={() => onRun("setor")}
        onDelete={() => onRun("batal")}
      />
    </div>
  );
};
