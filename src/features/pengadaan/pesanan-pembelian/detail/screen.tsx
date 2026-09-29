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
import { formatDateShort, formatNumber } from "@/lib/format";

import { useOrderAction, useOrderDetail } from "../api";
import {
  ORDER_LIST_PATH,
  overEstimateOf,
  remainingOf,
  statusNoteOf,
} from "../model";
import type { OrderAction, OrderDetail } from "../types";
import { OrderStatusBadge, OverEstimateAlert } from "../ui";

import { ItemList } from "./item-list";
import { ReceiptPanel } from "./receipt-panel";
import { StatusActions } from "./status-actions";
import { SummaryPanel } from "./summary-panel";

const TITLE = "Pesanan Pembelian";

const FAILURE_TITLE: Record<OrderAction, string> = {
  batal: "Pesanan belum dibatalkan.",
  tutup: "Pesanan belum ditutup.",
  hapus: "Pesanan belum dihapus.",
};

const CANCEL_TEXT =
  "Apakah Anda ingin membatalkan pesanan ini? Supplier perlu diberi tahu sendiri.";

const closeTextOf = (order: OrderDetail) =>
  `Apakah Anda ingin menutup pesanan ini? ${formatNumber(remainingOf(order))} barang yang belum datang tidak ditunggu lagi.`;

interface PropTypes {
  code: string;
}

export const OrderDetailScreen = (props: PropTypes) => {
  const { code } = props;

  const router = useRouter();
  const toast = useToast();
  const { isCanView } = useMenuAccess(MENU.PESANAN_PEMBELIAN);
  const listReturn = useListReturn(ORDER_LIST_PATH);
  const detail = useOrderDetail(isCanView ? code : undefined);
  const action = useOrderAction(code);
  const confirm = useFormConfirm();
  const [pickAction, setPickAction] = useState<OrderAction>("batal");
  const order = detail.data;
  const isNotFound =
    detail.error instanceof FetchError && detail.error.status === 404;

  const header = (title: string, subtitle?: string) => (
    <PageHeader
      title={title}
      subtitle={subtitle}
      backHref={listReturn}
      isBackPersistent
      action={
        order ? (
          <OrderStatusBadge status={order.status} note={statusNoteOf(order)} />
        ) : null
      }
    />
  );

  const onPick = (next: OrderAction) => {
    setPickAction(next);
    confirm.onOpen(next === "tutup" ? "update" : "delete");
  };

  const onRun = (next: OrderAction) =>
    action.mutate(next, {
      onSuccess: (response) => {
        toast.add({ title: response.message });
        if (next === "hapus") router.replace(listReturn);
      },
    });

  if (!isCanView) {
    return (
      <div className="pb-8">
        <PageHeader title={TITLE} backHref={domainHref(MENU.PENGADAAN)} />
        <EmptyState
          title="Anda tidak memiliki akses ke Pesanan Pembelian"
          description="Hubungi administrator bila Anda memang seharusnya memegang akses ini."
        />
      </div>
    );
  }

  if (isNotFound) {
    return (
      <FormNotFound
        noun="pesanan pembelian"
        backHref={listReturn}
        backLabel="Kembali ke Pesanan Pembelian"
      />
    );
  }

  if (!order) {
    return (
      <div className="pb-8">
        {header(TITLE)}

        {detail.error ? (
          <div role="alert">
            <EmptyState
              title="Gagal memuat pesanan pembelian"
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
                  label="Memuat pesanan pembelian"
                  rows={6}
                />
              </div>
            </Panel>
          </div>
        )}
      </div>
    );
  }

  const over =
    order.status === "CANCELLED"
      ? null
      : overEstimateOf({
          requestCode: order.purchaseRequest.code,
          totalIDR: Number(order.totalIDR),
          orderedTotalIDR: order.purchaseRequest.orderedTotalIDR,
          totalEstimatedIDR: order.purchaseRequest.totalEstimatedIDR,
        });

  return (
    <div className="pb-8">
      {header(
        order.supplier.name,
        `${order.code} · ${formatDateShort(order.orderDate)}`,
      )}

      <div className="space-y-4 px-gutter pb-4">
        <OverEstimateAlert over={over} />

        <SummaryPanel order={order} />
        <ReceiptPanel order={order} />

        {order.status === "CANCELLED" ? null : (
          <p className="text-muted-foreground text-body">
            Pembayaran ke supplier dicatat di Kas Keluar. Tulis kode{" "}
            <span className="text-foreground whitespace-nowrap tabular-nums">
              {order.code}
            </span>{" "}
            di Referensi.
          </p>
        )}

        <StatusActions
          order={order}
          pendingAction={action.isPending ? action.variables : null}
          onPick={onPick}
        />

        {action.error ? (
          <FormAlert
            title={FAILURE_TITLE[action.variables ?? pickAction]}
            message={action.error.message}
          />
        ) : null}

        <h2 className="text-title pt-2 font-semibold">Barang dipesan</h2>
      </div>

      <ItemList order={order} isRefreshing={detail.isFetching} />

      <FormConfirmDialog
        confirm={confirm}
        noun="pesanan pembelian"
        descriptions={{
          update: closeTextOf(order),
          delete: pickAction === "batal" ? CANCEL_TEXT : undefined,
        }}
        onSave={() => onRun("tutup")}
        onDelete={() => onRun(pickAction)}
      />
    </div>
  );
};
