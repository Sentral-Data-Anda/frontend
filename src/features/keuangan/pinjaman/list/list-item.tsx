import { Badge } from "@/components/common/display";
import type { DataTableConfig } from "@/components/common/list";
import { formatDate } from "@/lib/format";

import {
  DIRECTION_LABEL,
  interestLabelOf,
  STATUS_LABEL,
  money,
} from "../model";
import type { Loan } from "../types";

const STATUS_VARIANT = {
  ACTIVE: "wait",
  SETTLED: "success",
  CANCELLED: "neutral",
} as const;

export const loanTable = (): DataTableConfig<Loan> => ({
  columns: [
    {
      key: "code",
      header: "Kode",
      width: "minmax(0,1.5fr)",
      cell: (row) => (
        <span className="block truncate tabular-nums">{row.code}</span>
      ),
    },
    {
      key: "counterparty",
      header: "Pihak",
      width: "minmax(0,2.2fr)",
      cell: (row) => (
        <span className="block truncate" title={row.counterpartyName}>
          {row.counterpartyName}
        </span>
      ),
    },
    {
      key: "direction",
      header: "Arah",
      width: "minmax(0,1.6fr)",
      isSecondary: true,
      cell: (row) => (
        <span className="text-muted-foreground block truncate">
          {DIRECTION_LABEL[row.direction]}
        </span>
      ),
    },
    {
      key: "agreementDate",
      header: "Kesepakatan",
      width: "minmax(0,1.3fr)",
      isSecondary: true,
      cell: (row) => (
        <span className="text-muted-foreground block truncate tabular-nums">
          {formatDate(row.agreementDate)}
        </span>
      ),
    },
    {
      key: "principal",
      header: "Pokok",
      width: "minmax(0,1.6fr)",
      align: "end",
      cell: (row) => (
        <span className="block truncate tabular-nums">
          {money(row.principal)}
        </span>
      ),
    },
    {
      key: "interestAmount",
      header: "Bunga",
      width: "minmax(0,1.5fr)",
      align: "end",
      cell: (row) => (
        <span className="block truncate tabular-nums">
          {Number(row.interestAmount) === 0 ? "—" : money(row.interestAmount)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      width: "minmax(0,1.1fr)",
      cell: (row) => (
        <Badge variant={STATUS_VARIANT[row.status]}>
          {STATUS_LABEL[row.status]}
        </Badge>
      ),
    },
  ],
  getRowLabel: (row) => `Pinjaman ${row.code} dengan ${row.counterpartyName}`,
});

export const loanMeta = (loan: Loan) =>
  [
    loan.code,
    DIRECTION_LABEL[loan.direction],
    `${loan.termMonths} bulan`,
    interestLabelOf(loan.interestMode, loan.interestPercent),
  ].join(" · ");
