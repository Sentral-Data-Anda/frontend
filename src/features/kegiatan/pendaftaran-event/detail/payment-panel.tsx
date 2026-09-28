"use client";

import { Copy, ExternalLink, RefreshCw } from "lucide-react";

import { Button, buttonVariants } from "@/components/common/control";
import {
  Badge,
  DescriptionItem,
  DescriptionList,
  PANEL_TITLE,
  Panel,
} from "@/components/common/display";
import { useToast } from "@/components/common/feedback";
import { FormAlert } from "@/components/common/form";
import { formatDateTime, formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";

import { isPast } from "../model";
import {
  PAYMENT_STATUS_LABEL,
  type Payment,
  type PaymentStatus,
} from "../types";

const VARIANT = {
  PENDING: "draft",
  PAID: "success",
  EXPIRED: "neutral",
  FAILED: "due",
  CANCELLED: "neutral",
} as const satisfies Record<PaymentStatus, string>;

interface PropTypes {
  payment: Payment;
  isInvoiceMissing: boolean;
  isCanReissue: boolean;
  isReissuing: boolean;
  reissueError: string | null;
  onReissue: () => void;
}

export const PaymentPanel = (props: PropTypes) => {
  const {
    payment,
    isInvoiceMissing,
    isCanReissue,
    isReissuing,
    reissueError,
    onReissue,
  } = props;

  const toast = useToast();
  const invoiceUrl = payment.status === "PENDING" ? payment.invoiceUrl : null;
  const isDeadlineShown = payment.status !== "PAID" && payment.expiredAt;

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(invoiceUrl ?? "");
      toast.add({ title: "Tautan tagihan disalin" });
    } catch {
      toast.add({
        title: "Tautan belum tersalin",
        description: "Salin manual dari kotak tautan.",
        type: "error",
      });
    }
  };

  return (
    <Panel label="Pembayaran">
      <h2 className={cn(PANEL_TITLE, "px-gutter pt-4")}>Pembayaran</h2>

      <DescriptionList className="px-gutter pb-2">
        <DescriptionItem label="Status pembayaran">
          <Badge variant={VARIANT[payment.status]}>
            {PAYMENT_STATUS_LABEL[payment.status]}
          </Badge>
        </DescriptionItem>
        <DescriptionItem label="Nominal">
          <span className="tabular-nums">
            {formatRupiah(Number(payment.amount))}
          </span>
        </DescriptionItem>
        {isDeadlineShown ? (
          <DescriptionItem label="Batas bayar">
            <span className="tabular-nums">
              {formatDateTime(payment.expiredAt ?? "")}
            </span>
            {isPast(payment.expiredAt) ? (
              <span className="text-muted-foreground font-normal">
                {" "}
                · Lewat
              </span>
            ) : null}
          </DescriptionItem>
        ) : null}
        <DescriptionItem label="Kode tagihan">
          <span className="tabular-nums">{payment.code}</span>
        </DescriptionItem>
      </DescriptionList>

      {invoiceUrl ? (
        <div className="border-hairline space-y-2 border-t px-gutter py-4">
          <p className="text-body font-medium">Tautan tagihan</p>
          <p
            title={invoiceUrl}
            className="bg-muted text-muted-foreground truncate rounded-control px-3 py-2 text-body select-all"
          >
            {invoiceUrl}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => void onCopy()}>
              <Copy aria-hidden />
              Salin tautan
            </Button>
            <a
              href={invoiceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "cursor-pointer gap-1.5",
              )}
            >
              <ExternalLink aria-hidden />
              Buka
            </a>
          </div>
        </div>
      ) : null}

      {isInvoiceMissing ? (
        <div className="border-hairline space-y-3 border-t px-gutter py-4">
          <p className="text-body">
            Tagihan belum terbit.{" "}
            <span className="text-muted-foreground">
              {isCanReissue
                ? "Buat ulang tagihan untuk menerbitkan tautan baru."
                : "Hubungi administrator."}
            </span>
          </p>

          {isCanReissue ? (
            <Button
              type="button"
              variant="outline"
              disabled={isReissuing}
              onClick={onReissue}
            >
              <RefreshCw aria-hidden />
              {isReissuing ? "Membuat tagihan…" : "Buat ulang tagihan"}
            </Button>
          ) : null}

          {reissueError ? (
            <FormAlert title="Tagihan belum terbit." message={reissueError} />
          ) : null}
        </div>
      ) : null}
    </Panel>
  );
};
