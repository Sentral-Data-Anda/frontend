"use client";

import Link from "next/link";

import { DETAIL_LINK } from "@/components/common/display";
import { MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { formatNumber, formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";

import {
  ROLE_JEMAAT_PATH,
  VARIANCE_NORMAL,
  errorFixOf,
  type Variance,
} from "../model";
import type { BudgetReportDetail } from "../types";

const LINK = `${DETAIL_LINK} inline-flex min-h-9 items-center text-body`;

type Check = {
  key: string;
  text: string;
  isWarning: boolean;
  linkText?: string;
  href?: string;
};

interface PropTypes {
  report: BudgetReportDetail;
  variance: Variance;
  error: Error | null;
}

export const SubmitChecklist = (props: PropTypes) => {
  const { report, variance, error } = props;

  const roleJemaat = useMenuAccess(MENU.ROLE_JEMAAT);
  const untaggedCount = report.lines.filter((line) => !line.program).length;
  const isPositionMissing = errorFixOf(error)?.menu === MENU.ROLE_JEMAAT;
  const checks: Check[] = [
    {
      key: "receipt",
      text:
        report.listReceipt.length === 0
          ? "Belum ada kwitansi terlampir. Penanda tangan tidak punya bukti untuk dilihat."
          : `${formatNumber(report.listReceipt.length)} kwitansi terlampir.`,
      isWarning: report.listReceipt.length === 0,
    },
    {
      key: "line",
      text: `${formatNumber(report.lines.length)} baris pemakaian.`,
      isWarning: false,
    },
    {
      key: "variance",
      text: variance.isLarge
        ? `Selisih terhadap Kas Keluar ${formatRupiah(Math.abs(Number(variance.difference)))}. ${VARIANCE_NORMAL}`
        : `Selisih terhadap Kas Keluar ${formatRupiah(Math.abs(Number(variance.difference)))}.`,
      isWarning: variance.isLarge,
    },
    {
      key: "untagged",
      text: `${formatNumber(untaggedCount)} baris tanpa program.`,
      isWarning: false,
    },
    ...(isPositionMissing
      ? [
          {
            key: "position",
            text: `${error?.message ?? ""} Pengajuan akan ditolak.`,
            isWarning: true,
            linkText: "Lihat Role Jemaat",
            href: roleJemaat.isCanView ? ROLE_JEMAAT_PATH : undefined,
          },
        ]
      : []),
  ];

  return (
    <section aria-label="Periksa sebelum mengajukan" className="space-y-2">
      <h2 className="text-body font-medium">Periksa dulu sebelum mengajukan</h2>

      <ul className="space-y-2">
        {checks.map((check) => (
          <li
            key={check.key}
            className={cn(
              "rounded-control border p-3",
              check.isWarning
                ? "border-warning bg-warning/10"
                : "border-border bg-card",
            )}
          >
            <p className="text-body">{check.text}</p>

            {check.href && check.linkText ? (
              <Link href={check.href} className={LINK}>
                {check.linkText}
              </Link>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
};
