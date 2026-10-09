"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button, buttonVariants } from "@/components/common/control";
import {
  DescriptionItem,
  DescriptionList,
  Panel,
} from "@/components/common/display";
import { EmptyState, useToast } from "@/components/common/feedback";
import { FormAlert, FormNotFound } from "@/components/common/form";
import { DataList, DataListRow } from "@/components/common/list";
import { ConfirmDialog } from "@/components/common/overlay";
import { PageHeader } from "@/components/layout";
import { MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useBoolean } from "@/hooks/use-boolean";
import { useListReturn } from "@/hooks/use-list-return";
import { FetchError } from "@/lib/api/fetcher";
import { formatAmount, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

import { useInvoiceAction, useInvoiceDetail } from "../api";
import {
  INVOICE_LIST_PATH,
  NO_VIEW,
  invoiceEditHref,
  isEditable,
  isIssuable,
  isPayable,
  isRetractable,
  outstandingOf,
} from "../model";
import type { InvoiceAction } from "../types";
import { InvoiceStatusBadge } from "../ui";

import { PaymentDialog } from "./payment-dialog";

const BACK_LABEL = "Kembali ke Faktur Supplier";

const ACTION_TEXT: Record<
  Exclude<InvoiceAction, "terbitkan">,
  { title: string; description: string; confirm: string }
> = {
  batal: {
    title: "Batalkan faktur ini?",
    description:
      "Faktur yang dibatalkan tidak bisa dibayar lagi. Faktur yang sudah diposting ke jurnal ditolak — balik jurnalnya lebih dulu.",
    confirm: "Batalkan",
  },
  hapus: {
    title: "Hapus faktur ini?",
    description:
      "Faktur yang dihapus tidak muncul lagi di daftar. Faktur yang sudah diposting ke jurnal ditolak — balik jurnalnya lebih dulu.",
    confirm: "Hapus",
  },
};

interface PropTypes {
  publicId: string;
}

export const InvoiceDetailScreen = (props: PropTypes) => {
  const { publicId } = props;

  const router = useRouter();
  const toast = useToast();
  const { isCanView, isCanUpdate, isCanDelete } = useMenuAccess(
    MENU.SUPPLIER_INVOICE,
  );
  const listReturn = useListReturn(INVOICE_LIST_PATH);
  const detail = useInvoiceDetail(isCanView ? publicId : undefined);
  const action = useInvoiceAction(publicId);
  const [pending, setPending] = useState<InvoiceAction | null>(null);
  const isPaying = useBoolean(false);
  const invoice = detail.data;

  const onRun = async (next: InvoiceAction) => {
    try {
      await action.mutateAsync(next);
      setPending(null);
      if (next === "hapus") router.replace(listReturn);
    } catch {
      setPending(null);
    }
  };

  if (!isCanView) {
    return (
      <div className="pb-6">
        <PageHeader title="Supplier Invoice" backHref={listReturn} />
        <EmptyState title="Tidak bisa melihat faktur" description={NO_VIEW} />
      </div>
    );
  }

  if (detail.error instanceof FetchError && detail.error.status === 404) {
    return (
      <FormNotFound
        noun="faktur supplier"
        backHref={listReturn}
        backLabel={BACK_LABEL}
      />
    );
  }

  if (!invoice) {
    return (
      <div className="pb-6">
        <PageHeader title="Supplier Invoice" backHref={listReturn} />
        {detail.error ? (
          <div className="px-gutter py-5">
            <FormAlert
              title="Faktur gagal dimuat."
              message={detail.error.message}
            />
          </div>
        ) : null}
      </div>
    );
  }

  const outstanding = outstandingOf(invoice);

  return (
    <div className="space-y-4 pb-8">
      <PageHeader
        title={invoice.supplier.name}
        subtitle={`${invoice.code} · ${invoice.supplierInvoiceNumber}`}
        backHref={listReturn}
        isBackPersistent
        action={
          isCanUpdate && isEditable(invoice) ? (
            <Link
              href={invoiceEditHref(publicId)}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "cursor-pointer",
              )}
            >
              Ubah
            </Link>
          ) : null
        }
      />

      <Panel label="Ringkasan">
        <DescriptionList>
          <DescriptionItem label="Status">
            <InvoiceStatusBadge status={invoice.status} />
          </DescriptionItem>
          <DescriptionItem label="Tanggal faktur">
            {formatDate(invoice.invoiceDate)}
          </DescriptionItem>
          <DescriptionItem label="Jatuh tempo">
            {formatDate(invoice.dueDate)}
          </DescriptionItem>
          <DescriptionItem label="Pesanan pembelian">
            {invoice.purchaseOrder?.code ?? "—"}
          </DescriptionItem>
          <DescriptionItem label="Dibebankan ke" isWide>
            {invoice.expenseAccount
              ? `${invoice.expenseAccount.code} — ${invoice.expenseAccount.name}`
              : "Belum dipilih — ikut akun Beban Pengadaan"}
          </DescriptionItem>
          <DescriptionItem label="Total">
            {formatAmount(invoice.totalIDR)}
          </DescriptionItem>
          <DescriptionItem label="Sudah dibayar">
            {formatAmount(invoice.paidAmountIDR)}
          </DescriptionItem>
          <DescriptionItem label="Sisa">
            {formatAmount(outstanding)}
          </DescriptionItem>
        </DescriptionList>
      </Panel>

      <Panel label="Pembayaran">
        {invoice.payments.length === 0 ? (
          <p className="text-muted-foreground px-gutter py-4 text-body">
            Belum ada pembayaran untuk faktur ini.
          </p>
        ) : (
          <DataList
            items={invoice.payments}
            getKey={(payment) => payment.publicId}
            label="Daftar pembayaran faktur"
          >
            {(payment) => (
              <DataListRow
                id={payment.publicId}
                title={formatAmount(payment.amountIDR)}
                meta={[
                  payment.code,
                  formatDate(payment.paymentDate),
                  payment.account.name,
                  payment.reference,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              />
            )}
          </DataList>
        )}
      </Panel>

      <div className="flex flex-wrap gap-2 px-gutter">
        {isCanUpdate && isPayable(invoice) ? (
          <Button
            type="button"
            variant="outline"
            disabled={action.isPending}
            onClick={isPaying.onTrue}
          >
            Catat pembayaran
          </Button>
        ) : null}

        {isCanUpdate && isIssuable(invoice) ? (
          <Button
            type="button"
            disabled={action.isPending}
            onClick={() => {
              void onRun("terbitkan").then(() =>
                toast.add({ title: "Faktur diterbitkan" }),
              );
            }}
          >
            Terbitkan
          </Button>
        ) : null}

        {isCanUpdate &&
        invoice.status !== "CANCELLED" &&
        isRetractable(invoice) ? (
          <Button
            type="button"
            variant="outline"
            disabled={action.isPending}
            onClick={() => setPending("batal")}
          >
            Batalkan
          </Button>
        ) : null}

        {isCanDelete && isRetractable(invoice) ? (
          <Button
            type="button"
            variant="destructive"
            disabled={action.isPending}
            onClick={() => setPending("hapus")}
          >
            Hapus
          </Button>
        ) : null}
      </div>

      {action.error ? (
        <div className="px-gutter">
          <FormAlert
            title="Tindakan ini ditolak."
            message={action.error.message}
          />
        </div>
      ) : null}

      <PaymentDialog
        publicId={publicId}
        outstanding={outstanding}
        isOpen={isPaying.value}
        onClose={isPaying.onFalse}
        onPaid={() => {
          isPaying.onFalse();
          toast.add({ title: "Pembayaran tercatat" });
        }}
      />

      {pending && pending !== "terbitkan" ? (
        <ConfirmDialog
          isOpen
          onOpenChange={(isOpen) => {
            if (!isOpen) setPending(null);
          }}
          title={ACTION_TEXT[pending].title}
          description={ACTION_TEXT[pending].description}
          confirmLabel={ACTION_TEXT[pending].confirm}
          isPending={action.isPending}
          isClosedOnConfirm={false}
          onConfirm={() => void onRun(pending)}
        />
      ) : null}
    </div>
  );
};
