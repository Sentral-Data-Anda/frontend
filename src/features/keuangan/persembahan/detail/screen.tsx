"use client";

import Link from "next/link";
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
import { formatDateTime } from "@/lib/format";

import { usePersembahanDetail, useVoidPersembahan } from "../api";
import {
  NO_VIEW,
  PERSEMBAHAN_LIST_PATH,
  VOID_REASON_MAX,
  journalHref,
  voidText,
} from "../model";
import { FixLink } from "../ui";

import { SummaryPanel } from "./summary-panel";
import { VoidPanel } from "./void-panel";

const TITLE = "Persembahan";

const LINK =
  "text-primary cursor-pointer underline decoration-primary/30 underline-offset-4 transition-colors hover:decoration-primary focus-visible:decoration-primary";

interface PropTypes {
  code: string;
}

export const PersembahanDetailScreen = (props: PropTypes) => {
  const { code } = props;

  const toast = useToast();
  const { isCanView, isCanDelete } = useMenuAccess(MENU.PERSEMBAHAN);
  const journalAccess = useMenuAccess(MENU.JURNAL);
  const listReturn = useListReturn(PERSEMBAHAN_LIST_PATH);
  const detail = usePersembahanDetail(isCanView ? code : undefined);
  const voidPersembahan = useVoidPersembahan(code);
  const confirm = useFormConfirm();
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string | null>(null);
  const row = detail.data;
  const isNotFound =
    detail.error instanceof FetchError && detail.error.status === 404;
  const failure = voidPersembahan.error;

  const onOpenConfirm = () => {
    const trimmed = reason.trim();

    if (!trimmed) {
      setReasonError("Tulis alasan pembatalan");
      return;
    }

    setReasonError(null);
    confirm.onOpen("delete");
  };

  const onVoid = () =>
    voidPersembahan.mutate(reason.trim().slice(0, VOID_REASON_MAX), {
      onSuccess: (response) => {
        setReason("");
        toast.add({ title: response.message });
      },
    });

  if (!isCanView) {
    return (
      <div className="pb-8">
        <PageHeader title={TITLE} backHref={domainHref(MENU.KEUANGAN)} />
        <EmptyState
          title="Anda tidak memiliki akses ke Persembahan"
          description={NO_VIEW}
        />
      </div>
    );
  }

  if (isNotFound) {
    return (
      <FormNotFound
        noun="persembahan"
        backHref={listReturn}
        backLabel="Kembali ke Persembahan"
      />
    );
  }

  if (!row) {
    return (
      <div className="pb-8">
        <PageHeader title={TITLE} backHref={listReturn} isBackPersistent />

        {detail.error ? (
          <div role="alert">
            <EmptyState
              title="Gagal memuat persembahan"
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
                <DescriptionSkeleton label="Memuat persembahan" rows={5} />
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
        title={TITLE}
        subtitle={row.code}
        backHref={listReturn}
        isBackPersistent
      />

      <div className="space-y-4 px-gutter pb-4">
        <SummaryPanel row={row} />

        {row.status === "VOID" ? (
          <div className="space-y-2">
            <FormAlert
              tone="warning"
              title={`Dibatalkan${row.voidedBy ? ` oleh ${row.voidedBy.name}` : ""}${row.voidedAt ? ` · ${formatDateTime(row.voidedAt)}` : ""}`}
              message={
                row.reversalJournal
                  ? `${row.voidReason ?? ""} Entri jurnalnya sudah dibalik.`.trim()
                  : (row.voidReason ?? "Tanpa alasan tercatat.")
              }
            />
            {row.reversalJournal && journalAccess.isCanView ? (
              <Link
                href={journalHref(row.reversalJournal.code)}
                className={LINK}
              >
                Lihat entri pembalik {row.reversalJournal.code}
              </Link>
            ) : null}
          </div>
        ) : null}

        {failure ? (
          <div className="space-y-2">
            <FormAlert
              title="Persembahan belum dibatalkan dan masih Aktif."
              message={failure.message}
            />
            <FixLink error={failure} />
          </div>
        ) : null}

        {row.status === "ACTIVE" && isCanDelete ? (
          <VoidPanel
            row={row}
            reason={reason}
            error={reasonError ?? undefined}
            isBusy={voidPersembahan.isPending}
            onReasonChange={setReason}
            onConfirm={onOpenConfirm}
          />
        ) : null}
      </div>

      <FormConfirmDialog
        confirm={confirm}
        noun="persembahan"
        descriptions={{ delete: voidText(row.journal !== null) }}
        onDelete={onVoid}
      />
    </div>
  );
};
