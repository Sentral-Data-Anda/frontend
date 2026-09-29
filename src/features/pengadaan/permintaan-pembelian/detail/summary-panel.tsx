"use client";

import Link from "next/link";

import {
  Badge,
  DescriptionItem,
  DescriptionList,
  OptionalText,
  Panel,
} from "@/components/common/display";
import { MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { formatDate, formatRupiah } from "@/lib/format";
import { APPROVAL_STATUS_LABEL } from "@/types/persetujuan";

import { ORDER_STATUS_VARIANT, approvalHref, orderHref } from "../model";
import { ORDER_STATUS_LABEL, type PurchaseRequestDetail } from "../types";

const LINK =
  "text-primary cursor-pointer underline decoration-primary/30 underline-offset-4 transition-colors hover:decoration-primary focus-visible:decoration-primary";

const rupiahOf = (value: string) => formatRupiah(Number(value));

interface PropTypes {
  request: PurchaseRequestDetail;
}

export const SummaryPanel = (props: PropTypes) => {
  const { request } = props;

  const { isCanView: isCanViewApproval } = useMenuAccess(
    MENU.PERMINTAAN_PERSETUJUAN,
  );
  const { isCanView: isCanViewOrder } = useMenuAccess(MENU.PESANAN_PEMBELIAN);
  const { approval } = request;
  const approvalText = approval
    ? `${approval.code} · ${APPROVAL_STATUS_LABEL[approval.status]}`
    : null;
  const requestedText = [
    request.requestedBy?.name,
    formatDate(request.createdAt),
  ]
    .filter(Boolean)
    .join(" · ");
  const isOverOrdered =
    Number(request.orderedTotalIDR) > Number(request.totalEstimatedIDR);
  const isApproved = request.status === "APPROVED";
  const isNoted = approval?.status === "REJECTED" && Boolean(approval.note);

  return (
    <Panel label="Ringkasan permintaan">
      <DescriptionList className="px-gutter py-2">
        <DescriptionItem label="Keperluan" isWide isStacked>
          <span className="wrap-break-word">{request.purpose}</span>
        </DescriptionItem>
        <DescriptionItem label="Badan pelayanan">
          {request.bapel?.name ?? "—"}
        </DescriptionItem>
        <DescriptionItem label="Diminta oleh">
          <span className="tabular-nums">{requestedText}</span>
        </DescriptionItem>
        <DescriptionItem label="Dibutuhkan tanggal">
          <span className="tabular-nums">
            <OptionalText
              text={request.neededDate ? formatDate(request.neededDate) : null}
              empty="Tidak ditentukan"
            />
          </span>
        </DescriptionItem>
        <DescriptionItem label="Perkiraan total">
          <span className="font-medium tabular-nums">
            {rupiahOf(request.totalEstimatedIDR)}
          </span>
        </DescriptionItem>
        <DescriptionItem
          label="Persetujuan"
          isStacked={isNoted}
          isWide={isNoted}
        >
          <span className="block space-y-1">
            {approval && approvalText && isCanViewApproval ? (
              <Link href={approvalHref(approval.publicId)} className={LINK}>
                {approvalText}
              </Link>
            ) : (
              <OptionalText text={approvalText} empty="Belum diajukan" />
            )}
            {isNoted ? (
              <span className="text-muted-foreground block">
                Catatan penolak: {approval.note}
              </span>
            ) : null}
          </span>
        </DescriptionItem>
        {isApproved ? (
          <DescriptionItem label="Sudah dipesan" isStacked isWide>
            <span className="block space-y-1.5">
              <span className="flex flex-wrap items-center gap-2 tabular-nums">
                {`${rupiahOf(request.orderedTotalIDR)} dari ${rupiahOf(request.totalEstimatedIDR)}`}
                {isOverOrdered ? (
                  <Badge variant="warning">Melebihi perkiraan</Badge>
                ) : null}
              </span>
              {request.orders.length > 0 ? (
                <span className="flex flex-col gap-1">
                  {request.orders.map((order) => (
                    <span
                      key={order.code}
                      className="flex flex-wrap items-center gap-x-3 gap-y-0.5"
                    >
                      {isCanViewOrder ? (
                        <Link href={orderHref(order.code)} className={LINK}>
                          {order.code}
                        </Link>
                      ) : (
                        <span className="tabular-nums">{order.code}</span>
                      )}
                      <span className="tabular-nums">
                        {rupiahOf(order.totalIDR)}
                      </span>
                      <Badge variant={ORDER_STATUS_VARIANT[order.status]}>
                        {ORDER_STATUS_LABEL[order.status]}
                      </Badge>
                    </span>
                  ))}
                </span>
              ) : (
                <span className="text-muted-foreground block">
                  Belum ada pesanan.
                </span>
              )}
            </span>
          </DescriptionItem>
        ) : null}
      </DescriptionList>
    </Panel>
  );
};
