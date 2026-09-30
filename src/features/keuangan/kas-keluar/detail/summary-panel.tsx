"use client";

import Link from "next/link";

import {
  DescriptionItem,
  DescriptionList,
  OptionalText,
  Panel,
} from "@/components/common/display";
import { MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { formatDate, formatRupiah } from "@/lib/format";

import { accountHref, journalHref } from "../model";
import type { CashExpenseDetail } from "../types";

import { DETAIL_LINK } from "./link-style";

interface PropTypes {
  expense: CashExpenseDetail;
}

export const SummaryPanel = (props: PropTypes) => {
  const { expense } = props;

  const { isCanView: isCanViewAccount } = useMenuAccess(MENU.AKUN);
  const { isCanView: isCanViewJournal } = useMenuAccess(MENU.JURNAL);
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
            {formatRupiah(Number(expense.totalAmount))}
          </span>
        </DescriptionItem>
        {journal ? (
          <DescriptionItem label="Entri jurnal">
            {isCanViewJournal ? (
              <Link href={journalHref(journal.code)} className={DETAIL_LINK}>
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
