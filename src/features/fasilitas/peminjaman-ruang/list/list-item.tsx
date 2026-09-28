import { Eye, Pencil } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/common/control";
import { DataListRow, type DataTableConfig } from "@/components/common/list";
import { MENU, editHref } from "@/config/menu";
import { formatTimeRange } from "@/lib/format";
import { saveListFocus } from "@/lib/list-return";
import { cn } from "@/lib/utils";

import { LOAN_LIST_PATH, formatLoanDate, loanStatusOf } from "../model";
import type { LoanRoom } from "../types";

import { LoanStatusBadge } from "./loan-status";

const editHrefOf = (loan: LoanRoom) =>
  editHref(MENU.FASILITAS, MENU.PEMINJAMAN_RUANG, loan.code);

const saveFocus = (loan: LoanRoom) => saveListFocus(LOAN_LIST_PATH, loan.code);

const isPast = (loan: LoanRoom) => loanStatusOf(loan) === "DONE";

const labelOf = (loan: LoanRoom) =>
  `${isPast(loan) ? "Lihat" : "Ubah"} ${loan.purpose}, ${formatLoanDate(loan.date)}`;

const timeOf = (loan: LoanRoom) =>
  formatTimeRange(loan.startTime, loan.endTime);

const metaOf = (loan: LoanRoom) =>
  [formatLoanDate(loan.date), timeOf(loan), loan.room.name].join(" · ");

const truncated = (text: string) => (
  <span className="block truncate" title={text}>
    {text}
  </span>
);

interface PropTypes {
  loan: LoanRoom;
  isCanUpdate?: boolean;
}

export const LoanListItemRow = (props: PropTypes) => {
  const { loan, isCanUpdate = false } = props;

  const Icon = isPast(loan) ? Eye : Pencil;

  return (
    <DataListRow
      id={loan.code}
      title={loan.purpose}
      meta={metaOf(loan)}
      trailing={
        <>
          <LoanStatusBadge loan={loan} />

          {isCanUpdate ? (
            <Link
              href={editHrefOf(loan)}
              onClick={() => saveFocus(loan)}
              aria-label={labelOf(loan)}
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon-sm" }),
                "cursor-pointer",
              )}
            >
              <Icon aria-hidden />
            </Link>
          ) : null}
        </>
      }
    />
  );
};

export function peminjamanTable(
  isCanUpdate: boolean,
): DataTableConfig<LoanRoom> {
  return {
    columns: [
      {
        key: "when",
        header: "Waktu",
        width: "minmax(0,1.4fr)",
        narrowWidth: "minmax(0,1.4fr)",
        cell: (loan) => (
          <span className="min-w-0 tabular-nums">
            <span className="block truncate">{formatLoanDate(loan.date)}</span>
            <span className="text-muted-foreground block truncate text-caption">
              {timeOf(loan)}
            </span>
          </span>
        ),
      },
      {
        key: "room",
        header: "Ruang",
        width: "minmax(0,1.2fr)",
        narrowWidth: "minmax(0,1.2fr)",
        cell: (loan) => truncated(loan.room.name),
      },
      {
        key: "purpose",
        header: "Keperluan",
        width: "minmax(0,2.2fr)",
        narrowWidth: "minmax(0,2fr)",
        cell: (loan) => (
          <span className="block truncate font-medium" title={loan.purpose}>
            {loan.purpose}
          </span>
        ),
      },
      {
        key: "bapel",
        header: "Badan pelayanan",
        width: "minmax(0,1.2fr)",
        isSecondary: true,
        cell: (loan) =>
          loan.bapel ? (
            truncated(loan.bapel.name)
          ) : (
            <span className="text-muted-foreground">Pribadi</span>
          ),
      },
      {
        key: "jemaat",
        header: "Peminjam",
        width: "minmax(0,1.2fr)",
        isSecondary: true,
        cell: (loan) => truncated(loan.jemaat.name),
      },
      {
        key: "status",
        header: "Status",
        width: "minmax(0,0.9fr)",
        narrowWidth: "minmax(0,1fr)",
        cell: (loan) => <LoanStatusBadge loan={loan} />,
      },
    ],
    getRowHref: isCanUpdate ? editHrefOf : undefined,
    getRowLabel: labelOf,
    onRowOpen: saveFocus,
    rowIcon: <Pencil />,
  };
}
