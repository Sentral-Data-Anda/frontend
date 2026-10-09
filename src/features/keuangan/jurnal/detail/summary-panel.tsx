"use client";

import Link from "next/link";

import {
  DescriptionItem,
  DescriptionList,
  Panel,
} from "@/components/common/display";
import { MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { formatDate, formatDateTime } from "@/lib/format";
import { PERIOD_STATUS_LABEL } from "@/types/keuangan";

import {
  PERIODE_FISKAL_PATH,
  TEXT_LINK,
  journalHref,
  periodLabelOf,
  sourceLabelOf,
} from "../model";
import type { JournalEntryDetail, JournalEntryRef } from "../types";

const RELATION_LABEL = {
  reversedBy: "Dibalik oleh",
  reversalOf: "Pembalikan dari",
} as const;

interface PropTypes {
  entry: JournalEntryDetail;
}

export const SummaryPanel = (props: PropTypes) => {
  const { entry } = props;

  const periodAccess = useMenuAccess(MENU.FISCAL_PERIOD);
  const period = entry.fiscalPeriod;

  const relation = (
    kind: keyof typeof RELATION_LABEL,
    ref: JournalEntryRef,
  ) => (
    <DescriptionItem label={RELATION_LABEL[kind]} isWide>
      <span>
        <Link href={journalHref(ref.publicId)} className={TEXT_LINK}>
          {ref.code}
        </Link>
        <span className="text-muted-foreground">
          {" "}
          · {formatDate(ref.entryDate)}
        </span>
      </span>
    </DescriptionItem>
  );

  return (
    <Panel label="Ringkasan entri">
      <DescriptionList className="px-gutter py-2">
        <DescriptionItem label="Kode">
          <span className="tabular-nums">{entry.code}</span>
        </DescriptionItem>
        <DescriptionItem label="Tanggal">
          <span className="tabular-nums">{formatDate(entry.entryDate)}</span>
        </DescriptionItem>
        <DescriptionItem label="Keterangan" isWide>
          {entry.description}
        </DescriptionItem>
        <DescriptionItem label="Periode">
          {period === null ? (
            <span className="text-muted-foreground">Belum dibuka</span>
          ) : periodAccess.isCanView ? (
            <span>
              <Link href={PERIODE_FISKAL_PATH} className={TEXT_LINK}>
                {periodLabelOf(period)}
              </Link>
              <span className="text-muted-foreground">
                {" "}
                · {PERIOD_STATUS_LABEL[period.status]}
              </span>
            </span>
          ) : (
            `${periodLabelOf(period)} · ${PERIOD_STATUS_LABEL[period.status]}`
          )}
        </DescriptionItem>
        <DescriptionItem label="Sumber">{sourceLabelOf(entry)}</DescriptionItem>
        <DescriptionItem label="Diposting oleh">
          {entry.postedBy === null ? (
            <span className="text-muted-foreground">Belum diposting</span>
          ) : (
            <span>
              {entry.postedBy.name}
              {entry.postedAt ? (
                <span className="text-muted-foreground block text-caption tabular-nums">
                  {formatDateTime(entry.postedAt)}
                </span>
              ) : null}
            </span>
          )}
        </DescriptionItem>

        {entry.reversedBy ? relation("reversedBy", entry.reversedBy) : null}
        {entry.reversalOf ? relation("reversalOf", entry.reversalOf) : null}
      </DescriptionList>
    </Panel>
  );
};
