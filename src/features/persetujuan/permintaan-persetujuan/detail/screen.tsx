"use client";

import { TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button, buttonVariants } from "@/components/common/control";
import { DescriptionSkeleton, Panel } from "@/components/common/display";
import { EmptyState, useToast } from "@/components/common/feedback";
import { FormAlert } from "@/components/common/form";
import { ConfirmDialog } from "@/components/common/overlay";
import { PageHeader } from "@/components/layout";
import { MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useBoolean } from "@/hooks/use-boolean";
import { useListReturn } from "@/hooks/use-list-return";
import { FetchError } from "@/lib/api/fetcher";
import { formatApprovalAmount } from "@/types/persetujuan";

import { useApprove, usePermintaanDetail, useWithdraw } from "../api";
import { PERMINTAAN_LIST_PATH, documentTitle } from "../model";

import { ActionPanel } from "./action-panel";
import { StepTimeline } from "./step-timeline";
import { SummaryPanel } from "./summary-panel";

const TITLE = "Permintaan Persetujuan";

interface PropTypes {
  id: string;
}

export const PermintaanDetailScreen = (props: PropTypes) => {
  const { id } = props;

  const router = useRouter();
  const toast = useToast();
  const { isCanView, isCanUpdate } = useMenuAccess(MENU.PERMINTAAN_PERSETUJUAN);
  const listReturn = useListReturn(PERMINTAAN_LIST_PATH);
  const detail = usePermintaanDetail(id, isCanView);
  const approve = useApprove(id);
  const withdraw = useWithdraw(id);
  const isApproveOpen = useBoolean();
  const isWithdrawOpen = useBoolean();
  const request = detail.data;
  const isNotFound =
    detail.error instanceof FetchError && detail.error.status === 404;
  const isBusy = approve.isPending || withdraw.isPending;
  const actionError = approve.error ?? withdraw.error;

  const header = (title: string, subtitle?: string) => (
    <PageHeader
      title={title}
      subtitle={subtitle}
      backHref={listReturn}
      isBackPersistent
    />
  );

  const onOpenApprove = () => {
    withdraw.reset();
    isApproveOpen.onTrue();
  };

  const onOpenWithdraw = () => {
    approve.reset();
    isWithdrawOpen.onTrue();
  };

  const onDone = (message: string) => {
    toast.add({ title: message });
    router.replace(listReturn);
  };

  const onFail = () => {
    isApproveOpen.onFalse();
    isWithdrawOpen.onFalse();
    void detail.refetch();
  };

  const onApprove = () =>
    approve.mutate(undefined, {
      onSuccess: (response) => onDone(response.message),
      onError: onFail,
    });

  const onWithdraw = () =>
    withdraw.mutate(undefined, {
      onSuccess: (response) => onDone(response.message),
      onError: onFail,
    });

  if (!isCanView) {
    return (
      <div className="pb-8">
        {header(TITLE)}
        <EmptyState
          title="Anda tidak memiliki akses ke Permintaan Persetujuan"
          description="Hubungi administrator bila Anda memerlukan akses ini."
        />
      </div>
    );
  }

  if (isNotFound) {
    return (
      <div className="pb-8">
        {header(TITLE)}
        <EmptyState
          title="Permintaan tidak ditemukan"
          description="Permintaan ini tidak ada, bukan untuk Anda, atau alamatnya salah."
          action={
            <Link
              href={listReturn}
              className={buttonVariants({ variant: "outline" })}
            >
              Kembali ke permintaan persetujuan
            </Link>
          }
        />
      </div>
    );
  }

  if (detail.error && !request) {
    return (
      <div className="pb-8">
        {header(TITLE)}
        <div
          role="alert"
          className="flex flex-col items-center px-gutter py-12 text-center"
        >
          <TriangleAlert className="text-destructive mb-3 size-8" aria-hidden />
          <p className="text-body font-medium">Gagal memuat permintaan</p>
          <p className="text-muted-foreground mt-1 text-body">
            {detail.error.message}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => void detail.refetch()}
            disabled={detail.isFetching}
            className="mt-4"
          >
            {detail.isFetching ? "Memuat…" : "Coba lagi"}
          </Button>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="pb-8">
        {header(TITLE)}
        <div className="px-gutter">
          <Panel>
            <div className="px-gutter py-2">
              <DescriptionSkeleton label="Memuat permintaan" rows={6} />
            </div>
          </Panel>
        </div>
      </div>
    );
  }

  const title = documentTitle(request);

  return (
    <div className="pb-8">
      {header(request.code, title)}

      <div className="space-y-4 px-gutter">
        <SummaryPanel request={request} />
        <StepTimeline request={request} />

        {actionError ? (
          <FormAlert
            title={
              approve.error
                ? "Permintaan belum disetujui."
                : "Pengajuan belum ditarik."
            }
            message={actionError.message}
          />
        ) : null}

        <ActionPanel
          request={request}
          isCanUpdate={isCanUpdate}
          isBusy={isBusy}
          onApprove={onOpenApprove}
          onWithdraw={onOpenWithdraw}
        />
      </div>

      <ConfirmDialog
        isOpen={isApproveOpen.value}
        onOpenChange={isApproveOpen.setValue}
        title="Konfirmasi Tindakan"
        description={`Setujui ${title} senilai ${formatApprovalAmount(request.documentType, request.amount)}? Tanda tangan tidak bisa dibatalkan.`}
        confirmLabel={approve.isPending ? "Menyetujui…" : "Ya"}
        cancelLabel="Tidak"
        isPending={approve.isPending}
        isClosedOnConfirm={false}
        onConfirm={onApprove}
      />

      <ConfirmDialog
        isOpen={isWithdrawOpen.value}
        onOpenChange={isWithdrawOpen.setValue}
        title="Konfirmasi Tindakan"
        description={`Tarik pengajuan ${request.code}? Penanda tangan tidak bisa lagi memprosesnya. Dokumennya bisa diubah atau dihapus, lalu diajukan ulang.`}
        confirmLabel={withdraw.isPending ? "Menarik…" : "Ya"}
        cancelLabel="Tidak"
        isDestructive
        isPending={withdraw.isPending}
        isClosedOnConfirm={false}
        onConfirm={onWithdraw}
      />
    </div>
  );
};
