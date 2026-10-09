"use client";

import Link from "next/link";

import {
  DescriptionItem,
  DescriptionList,
  Panel,
} from "@/components/common/display";
import { MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { formatAmount, formatDate, formatMoney } from "@/lib/format";

import {
  TEXT_LINK,
  formatRate,
  isForeign,
  rateCaptionOf,
  requestHref,
  supplierHref,
} from "../model";
import type { OrderDetail } from "../types";

interface PropTypes {
  order: OrderDetail;
}

export const SummaryPanel = (props: PropTypes) => {
  const { order } = props;

  const supplierAccess = useMenuAccess(MENU.SUPPLIER);
  const requestAccess = useMenuAccess(MENU.PURCHASE_REQUEST);
  const isValas = isForeign(order.currencyCode);
  const request = order.purchaseRequest;

  return (
    <Panel label="Ringkasan pesanan">
      <DescriptionList className="px-gutter py-2">
        <DescriptionItem label="Supplier">
          {supplierAccess.isCanView ? (
            <Link
              href={supplierHref(order.supplier.code)}
              className={TEXT_LINK}
            >
              {order.supplier.name}
            </Link>
          ) : (
            order.supplier.name
          )}
        </DescriptionItem>
        <DescriptionItem label="Tanggal pesanan">
          <span className="tabular-nums">{formatDate(order.orderDate)}</span>
        </DescriptionItem>
        <DescriptionItem label="Permintaan" isWide>
          <span>
            {requestAccess.isCanView ? (
              <Link href={requestHref(request.code)} className={TEXT_LINK}>
                {request.code}
              </Link>
            ) : (
              <span className="tabular-nums">{request.code}</span>
            )}
            <span className="text-muted-foreground"> · {request.purpose}</span>
          </span>
        </DescriptionItem>
        <DescriptionItem label="Badan pelayanan">
          {request.bapel.name}
        </DescriptionItem>
        <DescriptionItem label="Mata uang">
          <span className="tabular-nums">
            {isValas
              ? `${order.currencyCode} · ${formatRate(order.exchangeRate)} per ${formatDate(order.rateDate)}`
              : `${order.currency.name} (${order.currencyCode})`}
          </span>
        </DescriptionItem>
        <DescriptionItem label="Total">
          <span className="text-right tabular-nums">
            <span className="font-semibold">
              {formatMoney(
                Number(isValas ? order.totalForeignCurrency : order.totalIDR),
                order.currencyCode,
              )}
            </span>
            {isValas ? (
              <span className="text-muted-foreground block text-caption">
                {`≈ ${formatAmount(order.totalIDR)} · ${rateCaptionOf(order.exchangeRate, order.rateDate)}`}
              </span>
            ) : null}
          </span>
        </DescriptionItem>
        <DescriptionItem label="Diterima">
          <span className="tabular-nums">
            {formatAmount(order.receivedTotalIDR)}
          </span>
        </DescriptionItem>
      </DescriptionList>
    </Panel>
  );
};
