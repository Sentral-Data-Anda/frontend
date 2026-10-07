"use client";

import { useSyncExternalStore } from "react";

import { ApprovalStatusBadge, QrCode } from "@/components/common/display";
import { formatDateTime } from "@/lib/format";

import { verificationHref } from "../model";
import type { ReportApprovalStep } from "../types";

const WAITING = "Menunggu tanda tangan jabatan ini";

// Nilai QR harus absolut supaya bisa dipindai, dan `origin` hanya ada di
// peramban: snapshot server kosong, jadi render pertama tidak menebak.
const subscribeOrigin = () => () => {};

interface PropTypes {
  step: ReportApprovalStep;
}

export const StepRow = (props: PropTypes) => {
  const { step } = props;

  const origin = useSyncExternalStore(
    subscribeOrigin,
    () => window.location.origin,
    () => "",
  );

  const qrValue =
    step.publicId && step.actedAt && origin
      ? verificationHref(origin, step.publicId)
      : null;

  return (
    <li className="flex items-start gap-3 py-2">
      <span className="text-muted-foreground shrink-0 text-body tabular-nums">
        {step.order}
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="min-w-0 text-body font-medium">
            {step.approverRoleName ?? "Jabatan tidak tercatat"}
          </span>
          <ApprovalStatusBadge status={step.status} />
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
};
