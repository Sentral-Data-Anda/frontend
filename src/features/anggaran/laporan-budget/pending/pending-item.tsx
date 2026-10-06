import Link from "next/link";

import { buttonVariants } from "@/components/common/control";
import { formatNumber, formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";

import { createForHref, reportDetailHref, waiverTextOf } from "../model";
import type { ComplianceRow } from "../types";
import { PendingBadge } from "../ui";

const LINK =
  "text-primary cursor-pointer underline decoration-primary/30 underline-offset-4 outline-none transition-colors hover:decoration-primary focus-visible:ring-ring focus-visible:rounded-sm focus-visible:ring-2";

interface PropTypes {
  row: ComplianceRow;
  month: string;
  isCanCreate: boolean;
}

export const PendingItem = (props: PropTypes) => {
  const { row, month, isCanCreate } = props;

  return (
    <li className="px-gutter">
      <div
        data-slot="row-body"
        className="border-border flex min-h-14 flex-wrap items-center gap-x-3 gap-y-2 py-3"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-body font-medium">
            {row.bapel?.name ?? "Badan pelayanan tanpa nama"}
          </p>
          <p className="text-muted-foreground text-caption tabular-nums">
            {formatNumber(row.disbursementCount)} pencairan ·{" "}
            {formatRupiah(Number(row.disbursementTotal))}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <PendingBadge state={row.state} />

          {row.report ? (
            <Link
              href={reportDetailHref(row.report.publicId)}
              className={`text-caption tabular-nums ${LINK}`}
            >
              {row.report.code}
            </Link>
          ) : null}

          {!row.report && row.state === "MISSING" && isCanCreate ? (
            <Link
              href={createForHref(row.bapelId, month)}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "cursor-pointer",
              )}
            >
              Tambah laporan
            </Link>
          ) : null}
        </div>

        {row.waiver ? (
          <p className="w-full text-body">{waiverTextOf(row.waiver)}</p>
        ) : null}
      </div>
    </li>
  );
};
