import { formatAmount } from "@/lib/format";

import type { BudgetReportDetail } from "../types";

interface PropTypes {
  report: BudgetReportDetail;
}

export const PrintHeader = (props: PropTypes) => {
  const { report } = props;

  return (
    <div className="hidden px-gutter pb-4 print:block">
      <h1 className="text-lead font-semibold">
        Laporan Pemakaian Budget {report.label}
      </h1>

      <p className="text-body">
        {report.bapel?.name ?? "—"} · {report.code}
      </p>

      <p className="text-body tabular-nums">
        Total pemakaian {formatAmount(report.totalAmount)}
      </p>
    </div>
  );
};
