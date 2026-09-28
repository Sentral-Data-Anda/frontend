"use client";

import { TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/common/control";
import { DescriptionSkeleton, Panel } from "@/components/common/display";
import { EmptyState, useToast } from "@/components/common/feedback";
import {
  FormConfirmDialog,
  FormNotFound,
  useFormConfirm,
} from "@/components/common/form";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useListReturn } from "@/hooks/use-list-return";
import { FetchError } from "@/lib/api/fetcher";

import {
  useCancelPendaftaran,
  usePendaftaranDetail,
  useReissueInvoice,
} from "../api";
import {
  PENDAFTARAN_LIST_PATH,
  cancelReasonOf,
  isInvoiceMissing,
} from "../model";

import { CancelAction } from "./cancel-action";
import { PaymentPanel } from "./payment-panel";
import { RegistrationPanel } from "./registration-panel";

const TITLE = "Pendaftaran Event";

const DESCRIPTIONS = {
  delete:
    "Apakah Anda ingin membatalkan pendaftaran ini? Kursinya akan kembali tersedia.",
  save: "Apakah Anda ingin membuat ulang tagihan pendaftaran ini? Tautan tagihan baru terbit dan kursinya ditahan sekitar satu jam lagi.",
};

interface PropTypes {
  code: string;
}

export const PendaftaranDetailScreen = (props: PropTypes) => {
  const { code } = props;

  const router = useRouter();
  const toast = useToast();
  const { isCanView, isCanCreate, isCanDelete } = useMenuAccess(
    MENU.PENDAFTARAN_EVENT,
  );
  const { isCanUpdate: isCanUpdateEvent } = useMenuAccess(MENU.EVENT);
  const listReturn = useListReturn(PENDAFTARAN_LIST_PATH);
  const detail = usePendaftaranDetail(isCanView ? code : undefined);
  const cancelPendaftaran = useCancelPendaftaran(code);
  const reissueInvoice = useReissueInvoice(code);
  const confirm = useFormConfirm();
  const registration = detail.data;
  const isNotFound =
    detail.error instanceof FetchError && detail.error.status === 404;

  const header = (title: string, subtitle?: string) => (
    <PageHeader
      title={title}
      subtitle={subtitle}
      backHref={listReturn}
      isBackPersistent
    />
  );

  const onCancel = () => {
    reissueInvoice.reset();
    cancelPendaftaran.mutate(undefined, {
      onSuccess: (cancelled) => {
        toast.add({ title: cancelled.message });
        router.replace(listReturn);
      },
    });
  };

  const onReissue = () => {
    cancelPendaftaran.reset();
    reissueInvoice.mutate(undefined, {
      onSuccess: (reissued) => toast.add({ title: reissued.message }),
    });
  };

  if (!isCanView) {
    return (
      <div className="pb-8">
        <PageHeader title={TITLE} backHref={domainHref(MENU.KEGIATAN)} />
        <EmptyState
          title="Anda tidak memiliki akses ke Pendaftaran Event"
          description="Hubungi administrator bila Anda memang seharusnya memegang akses ini."
        />
      </div>
    );
  }

  if (isNotFound) {
    return (
      <FormNotFound
        noun="pendaftaran"
        backHref={listReturn}
        backLabel="Kembali ke Pendaftaran Event"
      />
    );
  }

  if (detail.error && !registration) {
    return (
      <div className="pb-8">
        {header(TITLE)}
        <div
          role="alert"
          className="flex flex-col items-center px-gutter py-12 text-center"
        >
          <TriangleAlert className="text-destructive mb-3 size-8" aria-hidden />
          <p className="text-body font-medium">Gagal memuat pendaftaran</p>
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

  if (!registration) {
    return (
      <div className="pb-8">
        {header(TITLE)}
        <div className="px-gutter">
          <Panel>
            <div className="px-gutter py-2">
              <DescriptionSkeleton label="Memuat pendaftaran" rows={8} />
            </div>
          </Panel>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-8">
      {header(registration.participantName, registration.code)}

      <div className="flex flex-wrap items-start gap-4 px-gutter">
        <div className="min-w-0 flex-[999_1_32rem]">
          <RegistrationPanel
            registration={registration}
            isCanUpdateEvent={isCanUpdateEvent}
          />

          {isCanDelete ? (
            <CancelAction
              reason={cancelReasonOf(registration)}
              isCancelling={cancelPendaftaran.isPending}
              error={cancelPendaftaran.error?.message ?? null}
              onCancel={() => confirm.onOpen("delete")}
            />
          ) : null}
        </div>

        {registration.payment ? (
          <div className="min-w-0 flex-[1_1_20rem]">
            <PaymentPanel
              payment={registration.payment}
              isInvoiceMissing={isInvoiceMissing(registration)}
              isCanReissue={isCanCreate}
              isReissuing={reissueInvoice.isPending}
              reissueError={reissueInvoice.error?.message ?? null}
              onReissue={() => confirm.onOpen("save")}
            />
          </div>
        ) : null}
      </div>

      <FormConfirmDialog
        confirm={confirm}
        noun="pendaftaran"
        descriptions={DESCRIPTIONS}
        onSave={onReissue}
        onDelete={onCancel}
      />
    </div>
  );
};
