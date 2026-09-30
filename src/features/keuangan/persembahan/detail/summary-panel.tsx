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
import { cn } from "@/lib/utils";
import { JOURNAL_STATUS_LABEL, RECEIVE_METHOD_LABEL } from "@/types/keuangan";

import { ANONYMOUS, RECORDER, journalHref, periodLabel } from "../model";
import type { Persembahan } from "../types";
import { PersembahanStatusBadge } from "../ui";

const LINK =
  "text-primary cursor-pointer underline decoration-primary/30 underline-offset-4 transition-colors hover:decoration-primary focus-visible:decoration-primary";

interface PropTypes {
  row: Persembahan;
}

export const SummaryPanel = (props: PropTypes) => {
  const { row } = props;

  const journalAccess = useMenuAccess(MENU.JURNAL);
  const journalText = row.journal
    ? `${row.journal.code} · ${JOURNAL_STATUS_LABEL[row.journal.status]}`
    : null;

  return (
    <Panel label="Ringkasan persembahan">
      <div className="border-hairline flex flex-wrap items-center gap-x-3 gap-y-1 border-b px-gutter py-3">
        <PersembahanStatusBadge status={row.status} />
        <p
          className={cn(
            "text-lead font-semibold tabular-nums",
            row.status === "VOID" && "text-muted-foreground line-through",
          )}
        >
          {formatRupiah(Number(row.amount))}
        </p>
      </div>

      <DescriptionList className="px-gutter py-2">
        <DescriptionItem label="Kode">
          <span className="tabular-nums">{row.code}</span>
        </DescriptionItem>
        <DescriptionItem label="Tanggal terima">
          <span className="tabular-nums">{formatDate(row.receivedDate)}</span>
        </DescriptionItem>
        <DescriptionItem label="Tipe">
          {row.typePersembahan.name}
        </DescriptionItem>
        <DescriptionItem label="Pemberi">
          {row.jemaat?.name ?? row.donorName ?? (
            <span className="text-muted-foreground">{ANONYMOUS}</span>
          )}
        </DescriptionItem>
        <DescriptionItem label="Periode">
          <OptionalText text={periodLabel(row.period)} empty="Tanpa periode" />
        </DescriptionItem>
        <DescriptionItem label="Cara terima">
          {RECEIVE_METHOD_LABEL[row.receiveMethod]}
        </DescriptionItem>
        <DescriptionItem label="Diterima oleh">
          <OptionalText text={row.receivedBy?.name ?? null} empty={RECORDER} />
        </DescriptionItem>
        <DescriptionItem label="Ibadah">
          <OptionalText
            text={
              row.ibadah
                ? `${row.ibadah.code} · ${formatDate(row.ibadah.date)}`
                : null
            }
            empty="Tanpa ibadah"
          />
        </DescriptionItem>
        <DescriptionItem label="Entri jurnal">
          {row.journal && journalText && journalAccess.isCanView ? (
            <Link href={journalHref(row.journal.publicId)} className={LINK}>
              {journalText}
            </Link>
          ) : (
            <OptionalText text={journalText} empty="Belum diposting" />
          )}
        </DescriptionItem>
      </DescriptionList>
    </Panel>
  );
};
