import Link from "next/link";

import {
  DescriptionItem,
  DescriptionList,
  OptionalText,
  Panel,
} from "@/components/common/display";
import { formatDate, formatRupiah } from "@/lib/format";
import { JOURNAL_STATUS_LABEL } from "@/types/keuangan";

import { journalHref } from "../model";
import type { Transfer } from "../types";
import { TransferStatusBadge } from "../ui";

interface PropTypes {
  transfer: Transfer;
  isJournalLinked: boolean;
}

export const SummaryPanel = (props: PropTypes) => {
  const { transfer, isJournalLinked } = props;
  const { journal } = transfer;

  return (
    <Panel label="Ringkasan setoran">
      <DescriptionList className="px-gutter py-2">
        <DescriptionItem label="Kode">
          <span className="tabular-nums">{transfer.code}</span>
        </DescriptionItem>

        <DescriptionItem label="Tanggal">
          <span className="tabular-nums">
            {formatDate(transfer.transferDate)}
          </span>
        </DescriptionItem>

        <DescriptionItem label="Perpindahan" isStacked isWide>
          <span className="block">
            {transfer.fromAccount.name}
            <span aria-hidden> → </span>
            <span className="sr-only"> ke </span>
            {transfer.toAccount.name}
          </span>
          <span className="text-muted-foreground block text-caption font-normal tabular-nums">
            {transfer.fromAccount.code}
            <span aria-hidden> → </span>
            {transfer.toAccount.code}
          </span>
        </DescriptionItem>

        <DescriptionItem label="Jumlah">
          <span className="tabular-nums">
            {formatRupiah(Number(transfer.amount))}
          </span>
        </DescriptionItem>

        <DescriptionItem label="Referensi">
          <OptionalText text={transfer.reference} empty="Tanpa referensi" />
        </DescriptionItem>

        <DescriptionItem label="Status">
          <TransferStatusBadge status={transfer.status} />
        </DescriptionItem>

        {journal ? (
          <DescriptionItem label="Entri jurnal">
            {isJournalLinked ? (
              <Link
                href={journalHref(journal.publicId)}
                className="text-primary tabular-nums underline-offset-4 hover:underline"
              >
                {journal.code}
              </Link>
            ) : (
              <span className="tabular-nums">{journal.code}</span>
            )}
            <span className="text-muted-foreground font-normal">
              {` · ${JOURNAL_STATUS_LABEL[journal.status]}`}
            </span>
          </DescriptionItem>
        ) : null}

        <DescriptionItem label="Keterangan" isStacked isWide>
          <span className="font-normal">{transfer.description}</span>
        </DescriptionItem>
      </DescriptionList>
    </Panel>
  );
};
