"use client";

import Link from "next/link";

import {
  ApprovalStatusBadge,
  DETAIL_LINK,
  Panel,
} from "@/components/common/display";
import { FormAlert } from "@/components/common/form";
import { MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { formatDateTime } from "@/lib/format";

import { approvalHref } from "../model";
import type { CashExpenseDetail, ExpenseApproval } from "../types";

const REJECTED_TITLE = "Ditolak. Perbaiki lalu ajukan lagi.";

interface PropTypes {
  approval: ExpenseApproval;
  approvedBy: CashExpenseDetail["approvedBy"];
  approvedAt: string | null;
}

export const ApprovalPanel = (props: PropTypes) => {
  const { approval, approvedBy, approvedAt } = props;

  const { isCanView } = useMenuAccess(MENU.PERMINTAAN_PERSETUJUAN);
  const isRejected = approval.status === "REJECTED";

  const requestLink = isCanView ? (
    <Link
      href={approvalHref(approval.publicId)}
      className={`${DETAIL_LINK} tabular-nums`}
    >
      {approval.code}
    </Link>
  ) : (
    <span className="text-muted-foreground text-body tabular-nums">
      {approval.code}
    </span>
  );

  if (isRejected) {
    return (
      <section aria-label="Persetujuan" className="space-y-2">
        <FormAlert
          tone="warning"
          title={REJECTED_TITLE}
          message={approval.note ?? "Penanda tangan tidak menuliskan catatan."}
        />
        <p className="text-body">
          <span className="text-muted-foreground">Permintaan </span>
          {requestLink}
        </p>
      </section>
    );
  }

  return (
    <Panel label="Persetujuan">
      <div className="space-y-2 px-gutter py-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <ApprovalStatusBadge status={approval.status} />
          {requestLink}
        </div>

        {approvedBy ? (
          <p className="text-muted-foreground text-body">
            Disetujui {approvedBy.name}
            {approvedAt ? ` · ${formatDateTime(approvedAt)}` : ""}
          </p>
        ) : null}
      </div>
    </Panel>
  );
};
