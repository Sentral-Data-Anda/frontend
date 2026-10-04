"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

import { Badge, Panel, QrCode } from "@/components/common/display";
import { MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { formatDateTime } from "@/lib/format";
import {
  APPROVAL_STATUS_LABEL,
  type ApprovalStatus,
} from "@/types/persetujuan";

import { approvalHref, pendingStepText, verificationHref } from "../model";
import type { ReportApproval, ReportApprovalStep } from "../types";

import { DETAIL_LINK } from "./link-style";

const VARIANT: Record<ApprovalStatus, "draft" | "success" | "due" | "neutral"> =
  {
    PENDING: "draft",
    APPROVED: "success",
    REJECTED: "due",
    CANCELLED: "neutral",
  };

const WAITING = "Menunggu tanda tangan jabatan ini";

// Nilai QR harus absolut supaya bisa dipindai, dan `origin` hanya ada di
// peramban: snapshot server kosong, jadi render pertama tidak menebak.
const subscribeOrigin = () => () => {};

interface PropTypes {
  approval: ReportApproval;
}

export const ApprovalPanel = (props: PropTypes) => {
  const { approval } = props;

  const { isCanView } = useMenuAccess(MENU.PERMINTAAN_PERSETUJUAN);
  const origin = useSyncExternalStore(
    subscribeOrigin,
    () => window.location.origin,
    () => "",
  );

  const qrValueOf = (step: ReportApprovalStep) =>
    step.publicId && step.actedAt && origin
      ? verificationHref(origin, step.publicId)
      : null;

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
          {approval.steps.map((step) => {
            const qrValue = qrValueOf(step);

            return (
              <li key={step.order} className="flex items-start gap-3 py-2">
                <span className="text-muted-foreground shrink-0 text-body tabular-nums">
                  {step.order}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <span className="min-w-0 text-body font-medium">
                      {step.approverRoleName ?? "Jabatan tidak tercatat"}
                    </span>
                    <Badge variant={VARIANT[step.status]}>
                      {APPROVAL_STATUS_LABEL[step.status]}
                    </Badge>
                  </span>

                  <span className="text-muted-foreground block text-caption">
                    {step.actor
                      ? `${step.actor.name}${step.actedAt ? ` · ${formatDateTime(step.actedAt)}` : ""}`
                      : WAITING}
                  </span>

                  {step.note ? (
                    <span className="mt-1 block text-body">{step.note}</span>
                  ) : null}
                </span>

                {qrValue ? (
                  <span className="hidden shrink-0 print:block">
                    <QrCode value={qrValue} className="size-20" />
                  </span>
                ) : null}
              </li>
            );
          })}
        </ol>
      </div>
    </Panel>
  );
};
