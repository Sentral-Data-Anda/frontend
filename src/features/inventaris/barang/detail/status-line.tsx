"use client";

import Link from "next/link";

import { buttonVariants } from "@/components/common/control";
import { MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

import { DISPOSAL_METHOD_LABEL, approvalHref, disposalHref } from "../model";
import type { AssetDetail } from "../types";

const LINK = cn(buttonVariants({ variant: "link" }), "h-9 cursor-pointer px-0");

interface PropTypes {
  disposal: NonNullable<AssetDetail["disposal"]>;
}

export const StatusLine = (props: PropTypes) => {
  const { disposal } = props;

  const { isCanView: isCanViewCycle } = useMenuAccess(MENU.ASSET_TRANSACTION);
  const { isCanView: isCanViewApproval } = useMenuAccess(MENU.APPROVAL_REQUEST);
  const method = DISPOSAL_METHOD_LABEL[disposal.method];

  if (disposal.status === "APPROVED") {
    return (
      <p className="text-muted-foreground px-gutter pb-3 text-body">
        Dilepas {formatDate(disposal.disposalDate)} — {method}
      </p>
    );
  }

  return (
    <div
      role="status"
      className="flex flex-wrap items-center gap-x-4 px-gutter pb-3 text-body"
    >
      <p className="text-warning-foreground font-medium">
        Pelepasan ({method.toLowerCase()}) menunggu persetujuan
      </p>
      {isCanViewCycle ? (
        <Link href={disposalHref(disposal.code)} className={LINK}>
          Lihat pelepasan
        </Link>
      ) : null}
      {isCanViewApproval && disposal.approval ? (
        <Link href={approvalHref(disposal.approval.publicId)} className={LINK}>
          Lihat persetujuan
        </Link>
      ) : null}
    </div>
  );
};
