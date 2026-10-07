"use client";

import Link from "next/link";
import { Fragment, type ReactNode } from "react";

import { MENU, detailHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { formatDateTime } from "@/lib/format";
import type { ApprovalStatus } from "@/types/persetujuan";

import { ApprovalStatusBadge } from "./approval-status-badge";
import { DETAIL_LINK } from "./detail-link";
import { Panel } from "./panel";

export type ApprovalStepView = {
  order: number;
  approverRoleName: string | null;
  status: ApprovalStatus;
  actor: { name: string } | null;
  actedAt: string | null;
};

export type ApprovalView<S extends ApprovalStepView = ApprovalStepView> = {
  publicId: string;
  code: string;
  status: ApprovalStatus;
  steps?: readonly S[];
};

interface PropTypes<S extends ApprovalStepView> {
  approval: ApprovalView<S>;
  /** mis. "Menunggu persetujuan (1 dari 2)". Hanya dirender saat PENDING. */
  pendingText?: string;
  /** Mengganti baris langkah bawaan; mengembalikan `<li>` utuh. */
  renderStep?: (step: S) => ReactNode;
  /** Di atas baris status, di dalam panel. */
  alert?: ReactNode;
  /** Di bawah status dan langkah, di dalam panel. */
  children?: ReactNode;
}

export const ApprovalPanel = <S extends ApprovalStepView>(
  props: PropTypes<S>,
) => {
  const { approval, pendingText, renderStep, alert, children } = props;

  const { isCanView } = useMenuAccess(MENU.PERMINTAAN_PERSETUJUAN);

  const href = detailHref(
    MENU.PERSETUJUAN,
    MENU.PERMINTAAN_PERSETUJUAN,
    approval.publicId,
  );

  return (
    <Panel label="Persetujuan">
      <div className="space-y-2 px-gutter py-3">
        {alert}

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <ApprovalStatusBadge status={approval.status} />

          {isCanView ? (
            <Link
              href={href}
              className={`text-body tabular-nums ${DETAIL_LINK}`}
            >
              {approval.code}
            </Link>
          ) : (
            <span className="text-muted-foreground text-body tabular-nums">
              {approval.code}
            </span>
          )}

          {approval.status === "PENDING" && pendingText ? (
            <span className="text-muted-foreground text-body">
              {pendingText}
            </span>
          ) : null}
        </div>

        {approval.steps?.length ? (
          <ol className="divide-hairline divide-y">
            {approval.steps.map((step) =>
              renderStep ? (
                <Fragment key={step.order}>{renderStep(step)}</Fragment>
              ) : (
                <li
                  key={step.order}
                  className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 py-2 text-body"
                >
                  <span className="text-muted-foreground shrink-0 tabular-nums">
                    {step.order}
                  </span>
                  <span className="min-w-0 flex-1">
                    {step.approverRoleName ?? "Jabatan tidak tercatat"}
                  </span>
                  <ApprovalStatusBadge status={step.status} />
                  {step.actor ? (
                    <span className="text-muted-foreground">
                      {step.actor.name}
                      {step.actedAt
                        ? ` \u00b7 ${formatDateTime(step.actedAt)}`
                        : ""}
                    </span>
                  ) : null}
                </li>
              ),
            )}
          </ol>
        ) : null}

        {children}
      </div>
    </Panel>
  );
};
