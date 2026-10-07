"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/common/control";
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
import { useListReturn } from "@/hooks/use-list-return";
import { FetchError } from "@/lib/api/fetcher";
import { formatAmount, formatDateShort } from "@/lib/format";

import { useReceiptAction, useReceiptDetail } from "../api";
import {
  KAS_MASUK_LIST_PATH,
  NOUN,
  NO_VIEW,
  PERSEMBAHAN_NOTE,
  TITLE,
  fixLinkOf,
} from "../model";
import type { ReceiptAction } from "../types";
import { FixLink, ReceiptStatusBadge } from "../ui";

import { LineList } from "./line-list";
import { ReceiptActions } from "./receipt-actions";
import { SummaryPanel } from "./summary-panel";

const FAILURE_TITLE: Record<ReceiptAction, string> = {
  terima: "Kas masuk belum diterima.",
  batal: "Kas masuk belum dibatalkan.",
  hapus: "Kas masuk belum dihapus.",
};

const RECEIVE_TEXT =
  "Uang dicatat masuk dan pembukuannya dibuat. Setelah ini dokumen tidak bisa diubah.";

const CANCEL_TEXT =
  "Apakah Anda ingin membatalkan kas masuk ini? Pembukuannya akan dibalik dengan tanggal hari ini.";

const DELETE_TEXT =
  "Apakah Anda ingin menghapus draf kas masuk ini? Draf yang dihapus tidak bisa dikembalikan.";

interface PropTypes {
  publicId: string;
}

export const ReceiptDetailScreen = (props: PropTypes) => {
  const { publicId } = props;

  const router = useRouter();
  const toast = useToast();
  const { isCanView } = useMenuAccess(MENU.KAS_MASUK);
  const listReturn = useListReturn(KAS_MASUK_LIST_PATH);
  const detail = useReceiptDetail(isCanView ? publicId : undefined);
  const action = useReceiptAction(publicId);
  const confirm = useFormConfirm();
  const [pickAction, setPickAction] = useState<ReceiptAction>("terima");
  const [cancelReason, setCancelReason] = useState("");
  const receipt = detail.data;
  const isNotFound =
    detail.error instanceof FetchError && detail.error.status === 404;
  const fix = fixLinkOf(action.error);

  const header = (title: string, subtitle?: string) => (
    <PageHeader
      title={title}
      subtitle={subtitle}
      backHref={listReturn}
      isBackPersistent
      action={receipt ? <ReceiptStatusBadge status={receipt.status} /> : null}
    />
  );

  const onPick = (next: ReceiptAction) => {
    setPickAction(next);
    confirm.onOpen(next === "terima" ? "update" : "delete");
  };

  const onRun = (next: ReceiptAction) =>
    action.mutate(
      { action: next, cancelReason: cancelReason.trim() },
      {
        onSuccess: (response) => {
          toast.add({ title: response.message });
          if (next === "hapus") router.replace(listReturn);
        },
      },
    );

  if (!isCanView) {
    return (
      <div className="pb-8">
        <PageHeader title={TITLE} backHref={domainHref(MENU.KEUANGAN)} />
        <EmptyState
          title="Anda tidak memiliki akses ke Kas Masuk"
          description={NO_VIEW}
        />
      </div>
    );
  }

  if (isNotFound) {
    return (
      <FormNotFound
        noun={NOUN}
        backHref={listReturn}
        backLabel="Kembali ke Kas Masuk"
      />
    );
  }

  if (!receipt) {
    return (
      <div className="pb-8">
        {header(TITLE)}

        {detail.error ? (
          <div role="alert">
            <EmptyState
              title="Gagal memuat kas masuk"
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
                <DescriptionSkeleton label="Memuat kas masuk" rows={6} />
              </div>
            </Panel>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="pb-8">
      {header(
        receipt.payer,
        `${receipt.code} · ${formatDateShort(receipt.receiptDate)}`,
      )}

      <div className="space-y-4 px-gutter pb-4">
        <SummaryPanel receipt={receipt} />

        <p className="text-muted-foreground text-body">{PERSEMBAHAN_NOTE}</p>

        <ReceiptActions
          receipt={receipt}
          pendingAction={
            action.isPending ? (action.variables?.action ?? null) : null
          }
          cancelReason={cancelReason}
          onPickReason={setCancelReason}
          onPick={onPick}
        />

        {action.error ? (
          <div className="space-y-2">
            <FormAlert
              title={FAILURE_TITLE[action.variables?.action ?? pickAction]}
              message={action.error.message}
            />
            {fix ? <FixLink fix={fix} /> : null}
          </div>
        ) : null}

        <div className="flex flex-wrap items-baseline justify-between gap-2 pt-2">
          <h2 className="text-title font-semibold">Rincian</h2>
          <p className="text-body font-semibold tabular-nums">
            {`Total ${formatAmount(receipt.totalAmount)}`}
          </p>
        </div>
      </div>

      <LineList receipt={receipt} isRefreshing={detail.isFetching} />

      <FormConfirmDialog
        confirm={confirm}
        noun={NOUN}
        descriptions={{
          update: RECEIVE_TEXT,
          delete: pickAction === "batal" ? CANCEL_TEXT : DELETE_TEXT,
        }}
        onSave={() => onRun("terima")}
        onDelete={() => onRun(pickAction)}
      />
    </div>
  );
};
