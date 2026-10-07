"use client";

import { Button } from "@/components/common/control";
import { DescriptionSkeleton, Panel } from "@/components/common/display";
import { EmptyState } from "@/components/common/feedback";
import { FormNotFound } from "@/components/common/form";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useListReturn } from "@/hooks/use-list-return";
import { FetchError } from "@/lib/api/fetcher";
import { formatAmount, formatDateShort } from "@/lib/format";

import { usePaymentDetail } from "../api";
import { NO_VIEW, PAYMENT_LIST_PATH, paymentDateOf } from "../model";
import { PaymentStatusBadge } from "../ui";

import { SettlementNote } from "./settlement-note";
import { SummaryPanel } from "./summary-panel";

const TITLE = "Pembayaran";

interface PropTypes {
  publicId: string;
}

export const PaymentDetailScreen = (props: PropTypes) => {
  const { publicId } = props;

  const { isCanView } = useMenuAccess(MENU.PEMBAYARAN);
  const persembahanAccess = useMenuAccess(MENU.PERSEMBAHAN);
  const journalAccess = useMenuAccess(MENU.JURNAL);
  const listReturn = useListReturn(PAYMENT_LIST_PATH);
  const detail = usePaymentDetail(isCanView ? publicId : undefined);
  const payment = detail.data;
  const isNotFound =
    detail.error instanceof FetchError && detail.error.status === 404;

  if (!isCanView) {
    return (
      <div className="pb-8">
        <PageHeader title={TITLE} backHref={domainHref(MENU.KEUANGAN)} />
        <EmptyState
          title="Anda tidak memiliki akses ke Pembayaran"
          description={NO_VIEW}
        />
      </div>
    );
  }

  if (isNotFound) {
    return (
      <FormNotFound
        noun="pembayaran"
        backHref={listReturn}
        backLabel="Kembali ke Pembayaran"
      />
    );
  }

  if (!payment) {
    return (
      <div className="pb-8">
        <PageHeader title={TITLE} backHref={listReturn} isBackPersistent />

        {detail.error ? (
          <div role="alert">
            <EmptyState
              title="Gagal memuat pembayaran"
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
                <DescriptionSkeleton label="Memuat pembayaran" rows={6} />
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
        title={formatAmount(payment.amount)}
        subtitle={`${payment.code} · ${formatDateShort(paymentDateOf(payment))}`}
        backHref={listReturn}
        isBackPersistent
        action={<PaymentStatusBadge status={payment.status} />}
      />

      <div className="space-y-4 px-gutter pb-4">
        <SummaryPanel
          payment={payment}
          isPersembahanLinked={persembahanAccess.isCanView}
          isJournalLinked={journalAccess.isCanView}
        />

        {payment.status === "PAID" ? <SettlementNote /> : null}
      </div>
    </div>
  );
};
