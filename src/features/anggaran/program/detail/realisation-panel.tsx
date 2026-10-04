"use client";

import Link from "next/link";

import { Panel } from "@/components/common/display";
import { MENU } from "@/config/menu";
import { TaggedTotal } from "@/features/anggaran/shared";
import { useMenuAccess } from "@/features/auth";
import { formatRupiah } from "@/lib/format";

import {
  DISBURSED_LABEL,
  REPORTED_EMPTY,
  REPORTED_PANEL_LABEL,
  UNTAGGED_HINT,
  UNTAGGED_LABEL,
  expenseHref,
  reportDetailHref,
} from "../model";
import type { ReportedUsage } from "../types";

import { DETAIL_LINK } from "./link-style";

interface PropTypes {
  usage: ReportedUsage;
  disbursed: string;
  bapelId: number;
}

export const RealisationPanel = (props: PropTypes) => {
  const { usage, disbursed, bapelId } = props;

  const { isCanView: isCanViewReport } = useMenuAccess(MENU.LAPORAN_BUDGET);
  const { isCanView: isCanViewExpense } = useMenuAccess(MENU.KAS_KELUAR);

  const parts = usage.parts.map((part) => ({
    key: part.publicId,
    label: `${part.label} · ${part.code}`,
    amount: part.amount,
    href: reportDetailHref(part.publicId),
  }));

  return (
    <Panel>
      <div className="space-y-1 px-gutter py-3">
        <h2 className="text-title font-semibold">{REPORTED_PANEL_LABEL}</h2>
        <p className="text-muted-foreground text-caption">
          Dari laporan pemakaian budget yang sudah disetujui.
        </p>
      </div>

      <div className="px-gutter pb-3">
        {usage.parts.length === 0 && Number(usage.untagged) === 0 ? (
          <p className="text-muted-foreground text-body">{REPORTED_EMPTY}</p>
        ) : null}

        <TaggedTotal
          label={REPORTED_PANEL_LABEL}
          parts={parts}
          untaggedLabel={UNTAGGED_LABEL}
          untagged={usage.untagged}
          untaggedHint={UNTAGGED_HINT}
          renderPart={(part) =>
            isCanViewReport ? (
              <Link
                href={part.href ?? "#"}
                className={`min-w-0 truncate ${DETAIL_LINK}`}
              >
                {part.label}
              </Link>
            ) : (
              <span className="min-w-0 truncate">{part.label}</span>
            )
          }
        />
      </div>

      <div className="border-hairline flex items-baseline justify-between gap-3 border-t px-gutter py-3 text-body">
        {isCanViewExpense ? (
          <Link
            href={expenseHref(bapelId)}
            className={`min-w-0 ${DETAIL_LINK}`}
          >
            {DISBURSED_LABEL}
          </Link>
        ) : (
          <span className="min-w-0">{DISBURSED_LABEL}</span>
        )}
        <span className="shrink-0 tabular-nums">
          {formatRupiah(Number(disbursed))}
        </span>
      </div>
    </Panel>
  );
};
