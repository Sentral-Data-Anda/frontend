"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/common/control";
import {
  ApprovalPanel,
  DescriptionSkeleton,
  Panel,
} from "@/components/common/display";
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
import { todayJakarta } from "@/lib/date";

import { useCutiAction, useCutiDetail, type CutiAction } from "../api";
import {
  CUTI_LIST_PATH,
  REJECTED_TITLE,
  pendingStepTextOf,
  rejectedTextOf,
} from "../model";
import { CutiStatusBadge } from "../ui";

import { CutiActions } from "./cuti-actions";
import { QuotaPanel } from "./quota-panel";
import { ReasonPanel } from "./reason-panel";
import { SummaryPanel } from "./summary-panel";

const TITLE = "Leave";

const SUBMIT_QUESTION =
  "Apakah Anda ingin mengirim pengajuan cuti ini untuk ditandatangani?";

const CANCEL_QUESTION =
  "Apakah Anda ingin membatalkan cuti ini? Harinya kembali ke jatah karyawan.";

const FAILURE_TITLE: Record<CutiAction, string> = {
  pengajuan: "Pengajuan belum dikirim.",
  batal: "Cuti belum dibatalkan.",
  hapus: "Pengajuan belum dihapus.",
};

interface PropTypes {
  code: string;
}

export const CutiDetailScreen = (props: PropTypes) => {
  const { code } = props;

  const router = useRouter();
  const toast = useToast();
  const { isCanView } = useMenuAccess(MENU.LEAVE);
  const listReturn = useListReturn(CUTI_LIST_PATH);
  const detail = useCutiDetail(isCanView ? code : undefined);
  const action = useCutiAction(code);
  const confirm = useFormConfirm();
  const [pickAction, setPickAction] = useState<CutiAction>("pengajuan");
  const cuti = detail.data;
  const isNotFound =
    detail.error instanceof FetchError && detail.error.status === 404;
  const rejected = cuti ? rejectedTextOf(cuti) : null;

  const onPick = (next: CutiAction) => {
    setPickAction(next);
    confirm.onOpen(next === "pengajuan" ? "update" : "delete");
  };

  const onRun = () =>
    action.mutate(pickAction, {
      onSuccess: (response) => {
        toast.add({ title: response.message });
        if (pickAction === "hapus") router.replace(listReturn);
      },
    });

  if (!isCanView) {
    return (
      <div className="pb-8">
        <PageHeader title={TITLE} backHref={domainHref(MENU.HR)} />

        <EmptyState
          title="Anda tidak memiliki akses ke Leave"
          description="Hubungi administrator bila Anda memerlukan akses ini."
        />
      </div>
    );
  }

  if (isNotFound) {
    return (
      <FormNotFound
        noun="pengajuan cuti"
        backHref={listReturn}
        backLabel="Kembali ke Cuti"
      />
    );
  }

  if (!cuti) {
    return (
      <div className="pb-8">
        <PageHeader title={TITLE} backHref={listReturn} isBackPersistent />

        {detail.error ? (
          <div role="alert">
            <EmptyState
              title="Gagal memuat pengajuan cuti"
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
                <DescriptionSkeleton label="Memuat pengajuan cuti" rows={5} />
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
        title={cuti.karyawan.name}
        subtitle={cuti.code}
        backHref={listReturn}
        isBackPersistent
        action={<CutiStatusBadge cuti={cuti} />}
      />

      <div className="space-y-4 px-gutter pb-4">
        {rejected ? (
          <FormAlert tone="warning" title={REJECTED_TITLE} message={rejected} />
        ) : null}

        {action.error ? (
          <FormAlert
            title={FAILURE_TITLE[pickAction]}
            message={action.error.message}
          />
        ) : null}

        <SummaryPanel cuti={cuti} />

        <ReasonPanel cuti={cuti} />

        <QuotaPanel cuti={cuti} />

        {cuti.approval ? (
          <ApprovalPanel
            approval={cuti.approval}
            pendingText={pendingStepTextOf(cuti)}
          />
        ) : null}
      </div>

      <CutiActions
        cuti={cuti}
        today={todayJakarta()}
        isBusy={action.isPending}
        onPick={onPick}
      />

      <FormConfirmDialog
        confirm={confirm}
        noun="pengajuan cuti"
        descriptions={{
          update: SUBMIT_QUESTION,
          delete: pickAction === "batal" ? CANCEL_QUESTION : undefined,
        }}
        onSave={onRun}
        onDelete={onRun}
      />
    </div>
  );
};
