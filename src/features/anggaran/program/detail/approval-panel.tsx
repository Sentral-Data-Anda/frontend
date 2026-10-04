"use client";

import Link from "next/link";

import { Badge, Panel } from "@/components/common/display";
import { MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { formatDateTime } from "@/lib/format";
import {
  APPROVAL_STATUS_LABEL,
  type ApprovalStatus,
} from "@/types/persetujuan";

import { approvalHref, pendingStepText } from "../model";
import type { ProgramApproval } from "../types";

import { DETAIL_LINK } from "./link-style";

const VARIANT: Record<ApprovalStatus, "draft" | "success" | "due" | "neutral"> =
  {
    PENDING: "draft",
    APPROVED: "success",
    REJECTED: "due",
    CANCELLED: "neutral",
  };

interface PropTypes {
  approval: ProgramApproval;
}

export const ApprovalPanel = (props: PropTypes) => {
  const { approval } = props;

  const { isCanView } = useMenuAccess(MENU.PERMINTAAN_PERSETUJUAN);

  return (
    <Panel label="Persetujuan">
      <div className="space-y-2 px-gutter py-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <Badge variant={VARIANT[approval.status]}>
            {APPROVAL_STATUS_LABEL[approval.status]}
          </Badge>

          {isCanView ? (
            <Link
              href={approvalHref(approval.publicId)}
              className={`text-body tabular-nums ${DETAIL_LINK}`}
            >
              {approval.code}
            </Link>
          ) : (
            <span className="text-muted-foreground text-body tabular-nums">
              {approval.code}
            </span>
          )}

          {approval.status === "PENDING" ? (
            <span className="text-muted-foreground text-body">
              {pendingStepText(approval)}
            </span>
          ) : null}
        </div>

        <ol className="divide-hairline divide-y">
          {approval.steps.map((step) => (
            <li
              key={step.order}
              className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 py-2 text-body"
            >
              <span className="text-muted-foreground shrink-0 tabular-nums">
                {step.order}
              </span>
              <span className="min-w-0 flex-1">{step.approverRoleName}</span>
              <Badge variant={VARIANT[step.status]}>
                {APPROVAL_STATUS_LABEL[step.status]}
              </Badge>
              {step.actor ? (
                <span className="text-muted-foreground">
                  {step.actor.name}
                  {step.actedAt ? ` · ${formatDateTime(step.actedAt)}` : ""}
                </span>
              ) : null}
            </li>
          ))}
        </ol>
      </div>
    </Panel>
  );
};
