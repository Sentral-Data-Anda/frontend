"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { PANEL_TITLE, Panel } from "@/components/common/display";
import { formatAmount } from "@/lib/format";
import { cn } from "@/lib/utils";

import { slipHref, sortedPayslips } from "../model";
import type { PayrollRunDetail } from "../types";

/**
 * Satu-satunya tempat nama bersebelahan dengan nominal di sub menu ini, dan ia
 * di halaman yang harus sengaja dibuka (§0.3 no. 3). Yang tampil nama, kode,
 * dan bersih; rincian per baris satu klik lagi ke bawah.
 */
interface PropTypes {
  run: PayrollRunDetail;
}

export const PayslipPanel = (props: PropTypes) => {
  const { run } = props;

  if (run.payslips.length === 0) {
    return (
      <Panel label="Slip gaji">
        <h2 className={cn(PANEL_TITLE, "px-gutter pt-4")}>Slip gaji</h2>
        <p className="text-muted-foreground px-gutter py-4 text-body">
          Belum ada slip. Hitung penggajian ini untuk membuatnya dari kontrak
          dan komponen yang berlaku.
        </p>
      </Panel>
    );
  }

  return (
    <Panel label="Slip gaji">
      <h2 className={cn(PANEL_TITLE, "px-gutter pt-4 pb-2")}>Slip gaji</h2>

      <ul className="divide-hairline divide-y border-hairline border-t">
        {sortedPayslips(run).map((slip) => (
          <li key={slip.code}>
            <Link
              href={slipHref(run.code, slip.code)}
              aria-label={`Buka slip gaji ${slip.karyawan.name} ${slip.code}`}
              className="hover:bg-muted focus-visible:ring-ring flex min-h-14 cursor-pointer items-center gap-3 px-gutter py-2 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset"
            >
              <span className="min-w-0 flex-1">
                <span
                  className="block truncate text-body font-medium"
                  title={slip.karyawan.name}
                >
                  {slip.karyawan.name}
                </span>
                <span className="text-muted-foreground block truncate text-caption tabular-nums">
                  {slip.code}
                </span>
              </span>

              <span className="shrink-0 text-body font-medium tabular-nums">
                {formatAmount(slip.netAmount)}
              </span>

              <ChevronRight
                aria-hidden
                className="text-muted-foreground size-4 shrink-0"
              />
            </Link>
          </li>
        ))}
      </ul>
    </Panel>
  );
};
