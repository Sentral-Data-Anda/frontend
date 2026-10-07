"use client";

import Link from "next/link";

import {
  Badge,
  DescriptionItem,
  DescriptionList,
  DETAIL_LINK as LINK,
  OptionalText,
  Panel,
} from "@/components/common/display";
import { MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { formatDate, formatDateTime } from "@/lib/format";
import { APPROVAL_STATUS_LABEL } from "@/types/persetujuan";

import { AssetLink } from "../../asset-link";
import {
  DISPOSAL_METHOD_LABEL,
  DISPOSAL_STATUS_LABEL,
  DISPOSAL_STATUS_NOTE,
  DISPOSAL_STATUS_VARIANT,
  approvalHref,
  moneyOf,
} from "../../model";
import type { Disposal } from "../../types";

interface PropTypes {
  row: Disposal;
}

export const DisposalPanel = (props: PropTypes) => {
  const { row } = props;

  const { isCanView: isCanViewApproval } = useMenuAccess(
    MENU.PERMINTAAN_PERSETUJUAN,
  );
  const approvalText = row.approval
    ? `${row.approval.code} · ${APPROVAL_STATUS_LABEL[row.approval.status]}`
    : null;

  return (
    <Panel label="Pelepasan">
      <div className="border-hairline flex flex-wrap items-center gap-x-3 gap-y-1 border-b px-gutter py-3">
        <Badge variant={DISPOSAL_STATUS_VARIANT[row.status]}>
          {DISPOSAL_STATUS_LABEL[row.status]}
        </Badge>
        <p className="text-muted-foreground text-body">
          {DISPOSAL_STATUS_NOTE[row.status]}
        </p>
      </div>

      <DescriptionList className="px-gutter py-2">
        <DescriptionItem label="Barang">
          <AssetLink asset={row.asset} />
        </DescriptionItem>
        <DescriptionItem label="Cara">
          {DISPOSAL_METHOD_LABEL[row.method]}
        </DescriptionItem>
        <DescriptionItem label="Tanggal">
          <span className="tabular-nums">{formatDate(row.disposalDate)}</span>
        </DescriptionItem>
        <DescriptionItem label="Hasil">
          <span className="tabular-nums">
            <OptionalText
              text={row.method === "SOLD" ? moneyOf(row.proceeds) : null}
              empty="Tanpa hasil"
            />
          </span>
        </DescriptionItem>
        <DescriptionItem label="Persetujuan">
          {row.approval && approvalText && isCanViewApproval ? (
            <Link href={approvalHref(row.approval.publicId)} className={LINK}>
              {approvalText}
            </Link>
          ) : (
            <OptionalText text={approvalText} empty="Tanpa permintaan" />
          )}
        </DescriptionItem>
        <DescriptionItem label="Disetujui pada">
          <span className="tabular-nums">
            <OptionalText
              text={row.approvedAt ? formatDateTime(row.approvedAt) : null}
              empty="Belum disetujui"
            />
          </span>
        </DescriptionItem>
        <DescriptionItem label="Alasan" isStacked isWide>
          {row.reason}
        </DescriptionItem>
      </DescriptionList>
    </Panel>
  );
};
