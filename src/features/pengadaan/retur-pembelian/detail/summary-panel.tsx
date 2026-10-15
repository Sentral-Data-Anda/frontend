"use client";

import Link from "next/link";

import {
  DescriptionItem,
  DescriptionList,
  DETAIL_LINK as LINK,
  OptionalText,
  Panel,
} from "@/components/common/display";
import { MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { formatAmount, formatDate, formatDateTime } from "@/lib/format";

import { approvalListHref, receiptHref, supplierHref } from "../model";
import type { PurchaseReturn } from "../types";

interface PropTypes {
  row: PurchaseReturn;
}

export const SummaryPanel = (props: PropTypes) => {
  const { row } = props;

  const { isCanView: isCanViewReceipt } = useMenuAccess(MENU.GOODS_RECEIPT);
  const { isCanView: isCanViewSupplier } = useMenuAccess(MENU.SUPPLIER);
  const { isCanView: isCanViewApproval } = useMenuAccess(MENU.APPROVAL_REQUEST);
  const { supplier, goodsReceipt } = row;
  const isWaiting = row.status === "SUBMITTED" && row.approvedAt === null;

  return (
    <Panel label="Ringkasan retur">
      <DescriptionList className="px-gutter py-2">
        <DescriptionItem label="Alasan" isWide isStacked>
          <span className="wrap-break-word">{row.reason}</span>
        </DescriptionItem>
        <DescriptionItem label="Supplier">
          {supplier && isCanViewSupplier ? (
            <Link href={supplierHref(supplier.code)} className={LINK}>
              {supplier.name}
            </Link>
          ) : (
            <OptionalText text={supplier?.name ?? null} empty="—" />
          )}
        </DescriptionItem>
        <DescriptionItem label="Penerimaan barang">
          {goodsReceipt && isCanViewReceipt ? (
            <Link href={receiptHref(goodsReceipt.code)} className={LINK}>
              {goodsReceipt.code}
            </Link>
          ) : (
            <OptionalText text={goodsReceipt?.code ?? null} empty="—" />
          )}
        </DescriptionItem>
        <DescriptionItem label="Tanggal retur">
          <span className="tabular-nums">{formatDate(row.returnDate)}</span>
        </DescriptionItem>
        <DescriptionItem label="Nilai retur">
          <span className="font-medium tabular-nums">
            {formatAmount(row.totalIDR)}
          </span>
        </DescriptionItem>
        <DescriptionItem label="Persetujuan" isWide isStacked={isWaiting}>
          <span className="block space-y-1">
            {row.approvedAt ? (
              <span className="block tabular-nums">
                {`Disetujui ${formatDateTime(row.approvedAt)}`}
              </span>
            ) : row.status === "SUBMITTED" ? (
              // Bukan lewat `OptionalText`: itu menampilkan "—" dan menyimpan
              // kalimatnya untuk pembaca layar saja, padahal keadaan ini justru
              // yang perlu terbaca.
              <span className="block">Sudah diajukan, belum disetujui</span>
            ) : (
              <OptionalText text={null} empty="Belum diajukan" />
            )}
            {isWaiting ? (
              <span className="text-muted-foreground block">
                Retur tidak mencatat hasil tanda tangannya, hanya
                persetujuannya. Status sebenarnya — menunggu, ditolak, atau
                ditarik — ada di Permintaan Persetujuan.
              </span>
            ) : null}
            {isWaiting && isCanViewApproval ? (
              <Link href={approvalListHref} className={LINK}>
                Buka Permintaan Persetujuan
              </Link>
            ) : null}
          </span>
        </DescriptionItem>
      </DescriptionList>
    </Panel>
  );
};
