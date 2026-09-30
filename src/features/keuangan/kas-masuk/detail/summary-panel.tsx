"use client";

import Link from "next/link";

import {
  DescriptionItem,
  DescriptionList,
  Panel,
} from "@/components/common/display";
import { MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { formatDate, formatRupiah } from "@/lib/format";

import { TEXT_LINK, journalHref } from "../model";
import type { CashReceiptDetail } from "../types";

const EMPTY = "—";

interface PropTypes {
  receipt: CashReceiptDetail;
}

export const SummaryPanel = (props: PropTypes) => {
  const { receipt } = props;

  const journalAccess = useMenuAccess(MENU.JURNAL);

  return (
    <Panel label="Ringkasan kas masuk">
      <DescriptionList className="px-gutter py-2">
        <DescriptionItem label="Tanggal penerimaan">
          <span className="tabular-nums">
            {formatDate(receipt.receiptDate)}
          </span>
        </DescriptionItem>
        <DescriptionItem label="Diterima dari">{receipt.payer}</DescriptionItem>
        <DescriptionItem label="Masuk ke akun">
          <span>{`${receipt.intoAccount.code} — ${receipt.intoAccount.name}`}</span>
        </DescriptionItem>
        <DescriptionItem label="Total">
          <span className="font-semibold tabular-nums">
            {formatRupiah(Number(receipt.totalAmount))}
          </span>
        </DescriptionItem>
        <DescriptionItem label="Metode">
          {receipt.method ?? EMPTY}
        </DescriptionItem>
        <DescriptionItem label="Referensi">
          <span className="tabular-nums">{receipt.reference ?? EMPTY}</span>
        </DescriptionItem>
        <DescriptionItem label="Badan pelayanan">
          {receipt.bapel?.name ?? EMPTY}
        </DescriptionItem>
        {receipt.journal ? (
          <DescriptionItem label="Entri jurnal">
            {journalAccess.isCanView ? (
              <Link
                href={journalHref(receipt.journal.code)}
                className={`${TEXT_LINK} tabular-nums`}
              >
                {receipt.journal.code}
              </Link>
            ) : (
              <span className="tabular-nums">{receipt.journal.code}</span>
            )}
          </DescriptionItem>
        ) : null}
        <DescriptionItem label="Keterangan" isWide>
          {receipt.description}
        </DescriptionItem>
      </DescriptionList>
    </Panel>
  );
};
