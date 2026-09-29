"use client";

import Link from "next/link";

import { Panel } from "@/components/common/display";
import { MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { formatDate } from "@/lib/format";

import { TEXT_LINK, receiptHref, receiptListHref } from "../model";
import type { OrderDetail } from "../types";

interface PropTypes {
  order: OrderDetail;
}

export const ReceiptPanel = (props: PropTypes) => {
  const { order } = props;

  const { isCanView } = useMenuAccess(MENU.PENERIMAAN_BARANG);
  const { receipts } = order;

  return (
    <Panel label="Penerimaan">
      <div className="space-y-2 px-gutter py-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 className="text-body font-semibold">Penerimaan</h2>
          {isCanView && receipts.length > 1 ? (
            <Link href={receiptListHref(order.code)} className={TEXT_LINK}>
              Lihat di Penerimaan Barang
            </Link>
          ) : null}
        </div>

        {receipts.length === 0 ? (
          <p className="text-muted-foreground text-body">
            Belum ada barang yang diterima.
          </p>
        ) : (
          <ul className="space-y-1">
            {receipts.map((receipt) => (
              <li
                key={receipt.code}
                className="flex flex-wrap items-baseline gap-x-3 text-body"
              >
                {isCanView ? (
                  <Link href={receiptHref(receipt.code)} className={TEXT_LINK}>
                    {receipt.code}
                  </Link>
                ) : (
                  <span className="tabular-nums">{receipt.code}</span>
                )}
                <span className="text-muted-foreground tabular-nums">
                  {formatDate(receipt.receivedDate)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Panel>
  );
};
