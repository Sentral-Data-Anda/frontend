"use client";

import Link from "next/link";

import {
  DescriptionItem,
  DescriptionList,
  DETAIL_LINK,
  OptionalText,
  Panel,
} from "@/components/common/display";
import { MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { formatAmount, formatDate } from "@/lib/format";

import { accountHref, journalHref } from "../model";
import type { CashExpenseDetail } from "../types";

interface PropTypes {
  expense: CashExpenseDetail;
}

export const SummaryPanel = (props: PropTypes) => {
  const { expense } = props;

  const { isCanView: isCanViewAccount } = useMenuAccess(MENU.CHART_OF_ACCOUNT);
  const { isCanView: isCanViewJournal } = useMenuAccess(MENU.JOURNAL_ENTRY);
  const account = expense.paidFromAccount;
  const accountText = `${account.code} — ${account.name}`;
  const { journal } = expense;

  return (
    <Panel label="Ringkasan kas keluar">
      <DescriptionList className="px-gutter py-2">
        <DescriptionItem label="Dibayarkan kepada">
          <span className="wrap-break-word">{expense.payee}</span>
        </DescriptionItem>
        <DescriptionItem label="Tanggal keluar">
          <span className="tabular-nums">
            {formatDate(expense.expenseDate)}
          </span>
        </DescriptionItem>
        <DescriptionItem label="Dibayar dari">
          {isCanViewAccount ? (
            <Link href={accountHref(account.code)} className={DETAIL_LINK}>
              {accountText}
            </Link>
          ) : (
            <span className="tabular-nums">{accountText}</span>
          )}
        </DescriptionItem>
        <DescriptionItem label="Cara bayar">
          <OptionalText text={expense.method} empty="Tidak dicatat" />
        </DescriptionItem>
        <DescriptionItem label="Referensi">
          <span className="tabular-nums">
            <OptionalText text={expense.reference} empty="Tidak ada" />
          </span>
        </DescriptionItem>
        <DescriptionItem label="Badan pelayanan">
          <OptionalText text={expense.bapel?.name ?? null} empty="—" />
        </DescriptionItem>
        <DescriptionItem label="Total keluar">
          <span className="font-medium tabular-nums">
            {formatAmount(expense.totalAmount)}
          </span>
        </DescriptionItem>
        {journal ? (
          <DescriptionItem label="Entri jurnal">
            {isCanViewJournal ? (
              <Link
                href={journalHref(journal.publicId)}
                className={DETAIL_LINK}
              >
                {journal.code}
              </Link>
            ) : (
              <span className="tabular-nums">{journal.code}</span>
            )}
          </DescriptionItem>
        ) : null}
        {expense.cancelReason ? (
          <DescriptionItem label="Alasan pembatalan" isWide isStacked>
            <span className="wrap-break-word">{expense.cancelReason}</span>
          </DescriptionItem>
        ) : null}
        <DescriptionItem label="Keterangan" isWide isStacked>
          <span className="wrap-break-word">{expense.description}</span>
        </DescriptionItem>
      </DescriptionList>
    </Panel>
  );
};
