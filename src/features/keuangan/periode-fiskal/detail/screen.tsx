"use client";

import Link from "next/link";

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
import { useBoolean } from "@/hooks/use-boolean";
import { useListReturn } from "@/hooks/use-list-return";
import { FetchError } from "@/lib/api/fetcher";

import { useClosePeriod, useFiscalPeriod } from "../api";
import {
  CLOSE_FAILED_TITLE,
  LINK_CLASS,
  PERIODE_FISKAL_LIST_PATH,
  closeText,
  listYearHref,
  yearInMessage,
} from "../model";
import { PeriodStatus } from "../ui";

import { CloseChecklist } from "./close-checklist";
import { PeriodActions } from "./period-actions";
import { ReopenDialog } from "./reopen-dialog";
import { SummaryPanel } from "./summary-panel";

const TITLE = "Periode Fiskal";

interface PropTypes {
  id: string;
}

export const PeriodDetailScreen = (props: PropTypes) => {
  const { id } = props;

  const toast = useToast();
  const { isCanView, isCanUpdate } = useMenuAccess(MENU.PERIODE_FISKAL);
  const listReturn = useListReturn(PERIODE_FISKAL_LIST_PATH);
  const detail = useFiscalPeriod(isCanView ? id : undefined);
  const closePeriod = useClosePeriod(id);
  const confirm = useFormConfirm();
  const isReopenOpen = useBoolean();
  const period = detail.data;
  const isNotFound =
    detail.error instanceof FetchError && detail.error.status === 404;
  const blockerYear = closePeriod.error
    ? yearInMessage(closePeriod.error.message)
    : null;

  const onCloseBook = () =>
    closePeriod.mutate(undefined, {
      onSuccess: (result) => toast.add({ title: result.message }),
    });

  const onReopened = () => {
    isReopenOpen.onFalse();
    toast.add({ title: `Buku ${period?.label ?? ""} dibuka kembali.` });
  };

  if (!isCanView) {
    return (
      <div className="pb-8">
        <PageHeader title={TITLE} backHref={domainHref(MENU.KEUANGAN)} />

        <EmptyState
          title="Anda tidak memiliki akses ke Periode Fiskal"
          description="Hubungi administrator bila Anda memerlukan akses ini."
        />
      </div>
    );
  }

  if (isNotFound) {
    return (
      <FormNotFound
        noun="periode fiskal"
        backHref={listReturn}
        backLabel="Kembali ke Periode Fiskal"
      />
    );
  }

  if (!period) {
    return (
      <div className="pb-8">
        <PageHeader title={TITLE} backHref={listReturn} isBackPersistent />

        {detail.error ? (
          <div role="alert">
            <EmptyState
              title="Gagal memuat periode"
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
                <DescriptionSkeleton label="Memuat periode" rows={5} />
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
        title={period.label}
        subtitle={TITLE}
        backHref={listReturn}
        isBackPersistent
        action={<PeriodStatus status={period.status} />}
      />

      <div className="space-y-4 px-gutter">
        {closePeriod.error ? (
          <div className="space-y-2">
            <FormAlert
              title={CLOSE_FAILED_TITLE}
              message={closePeriod.error.message}
            />

            {blockerYear ? (
              <Link
                href={listYearHref(blockerYear)}
                className={`${LINK_CLASS} inline-flex min-h-9 items-center text-body`}
              >
                Lihat periode tahun {blockerYear}
              </Link>
            ) : null}
          </div>
        ) : null}

        <SummaryPanel period={period} />

        {period.status === "OPEN" && isCanUpdate ? (
          <CloseChecklist period={period} />
        ) : null}
      </div>

      {isCanUpdate ? (
        <PeriodActions
          period={period}
          isPending={closePeriod.isPending}
          onCloseBook={() => confirm.onOpen("update")}
          onReopen={isReopenOpen.onTrue}
        />
      ) : null}

      <FormConfirmDialog
        confirm={confirm}
        noun="periode fiskal"
        descriptions={{ update: closeText(period) }}
        onSave={onCloseBook}
      />

      <ReopenDialog
        id={id}
        label={period.label}
        isOpen={isReopenOpen.value}
        onClose={isReopenOpen.onFalse}
        onReopened={onReopened}
      />
    </div>
  );
};
