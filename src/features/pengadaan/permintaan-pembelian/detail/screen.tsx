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

import { useRequestAction, useRequestDetail } from "../api";
import { REQUEST_LIST_PATH, isRequestFinished } from "../model";
import type { PurchaseRequestDetail, RequestAction } from "../types";
import { RequestStatusBadge } from "../ui";

import { AttachmentList } from "./attachment-list";
import { ItemList } from "./item-list";
import { StatusActions } from "./status-actions";
import { SummaryPanel } from "./summary-panel";

const TITLE = "Purchase Request";

const FAILURE_TITLE: Record<RequestAction, string> = {
  pengajuan: "Permintaan belum diajukan.",
  tarik: "Pengajuan belum ditarik.",
  hapus: "Permintaan belum dihapus.",
};

const DESCRIPTIONS = {
  update:
    "Apakah Anda ingin mengajukan permintaan ini untuk disetujui? Permintaan tidak bisa diubah selama menunggu.",
  withdraw:
    "Apakah Anda ingin menarik pengajuan ini? Permintaan kembali menjadi Draf.",
};

interface PropTypes {
  code: string;
}

export const RequestDetailScreen = (props: PropTypes) => {
  const { code } = props;

  const router = useRouter();
  const toast = useToast();
  const { isCanView } = useMenuAccess(MENU.PURCHASE_REQUEST);
  const listReturn = useListReturn(REQUEST_LIST_PATH);
  const detail = useRequestDetail(isCanView ? code : undefined);
  const action = useRequestAction(code);
  const confirm = useFormConfirm();
  const [pickAction, setPickAction] = useState<RequestAction>("pengajuan");
  const request = detail.data;
  const isNotFound =
    detail.error instanceof FetchError && detail.error.status === 404;
  const failure = action.error;
  const isFinished = failure ? isRequestFinished(failure.message) : false;

  const header = (
    title: string,
    subtitle?: string,
    status?: PurchaseRequestDetail["status"],
  ) => (
    <PageHeader
      title={title}
      subtitle={subtitle}
      backHref={listReturn}
      isBackPersistent
      action={status ? <RequestStatusBadge status={status} /> : null}
    />
  );

  const onPick = (next: RequestAction) => {
    setPickAction(next);
    confirm.onOpen(next === "pengajuan" ? "update" : "delete");
  };

  const onRun = (next: RequestAction) =>
    action.mutate(next, {
      onSuccess: (response) => {
        toast.add({ title: response.message });
        if (next === "hapus") router.replace(listReturn);
      },
    });

  if (!isCanView) {
    return (
      <div className="pb-8">
        <PageHeader title={TITLE} backHref={domainHref(MENU.PROCUREMENT)} />
        <EmptyState
          title="Anda tidak memiliki akses ke Purchase Request"
          description="Hubungi administrator bila Anda memang seharusnya memegang akses ini."
        />
      </div>
    );
  }

  if (isNotFound) {
    return (
      <FormNotFound
        noun="permintaan pembelian"
        backHref={listReturn}
        backLabel="Kembali ke Permintaan Pembelian"
      />
    );
  }

  if (!request) {
    return (
      <div className="pb-8">
        {header(TITLE)}

        {detail.error ? (
          <div role="alert">
            <EmptyState
              title="Gagal memuat permintaan pembelian"
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
                <DescriptionSkeleton
                  label="Memuat permintaan pembelian"
                  rows={5}
                />
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
        request.purpose,
        [request.code, request.bapel?.name].filter(Boolean).join(" · "),
        request.status,
      )}

      <div className="space-y-4 px-gutter pb-4">
        <SummaryPanel request={request} />

        <StatusActions
          request={request}
          pendingAction={action.isPending ? action.variables : null}
          onPick={onPick}
        />

        {failure ? (
          <FormAlert
            tone={isFinished ? "info" : "error"}
            title={
              isFinished
                ? "Permintaan ini sudah diputus sebelum ditarik."
                : FAILURE_TITLE[action.variables ?? pickAction]
            }
            message={failure.message}
          />
        ) : null}

        <h2 className="text-title pt-2 font-semibold">Barang yang diminta</h2>
      </div>

      <ItemList items={request.items} isRefreshing={detail.isFetching} />

      {request.attachments.length > 0 ? (
        <div className="space-y-3 px-gutter pt-6">
          <h2 className="text-title font-semibold">Penawaran</h2>
          <AttachmentList attachments={request.attachments} />
        </div>
      ) : null}

      <FormConfirmDialog
        confirm={confirm}
        noun="permintaan pembelian"
        descriptions={{
          update: DESCRIPTIONS.update,
          delete: pickAction === "tarik" ? DESCRIPTIONS.withdraw : undefined,
        }}
        onSave={() => onRun("pengajuan")}
        onDelete={() => onRun(pickAction)}
      />
    </div>
  );
};
