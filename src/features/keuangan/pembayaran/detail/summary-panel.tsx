import Link from "next/link";

import {
  DescriptionItem,
  DescriptionList,
  OptionalText,
  Panel,
} from "@/components/common/display";
import { formatAmount, formatDateTime } from "@/lib/format";
import { JOURNAL_STATUS_LABEL } from "@/types/keuangan";

import {
  PURPOSE_LABEL,
  STALE_PENDING_NOTE,
  TEXT_LINK,
  giverOf,
  isStalePending,
  journalHref,
  persembahanHref,
} from "../model";
import type { Payment } from "../types";
import { PaymentStatusBadge } from "../ui";

const periodFormat = new Intl.DateTimeFormat("id-ID", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

interface PropTypes {
  payment: Payment;
  isPersembahanLinked: boolean;
  isJournalLinked: boolean;
}

export const SummaryPanel = (props: PropTypes) => {
  const { payment, isPersembahanLinked, isJournalLinked } = props;
  const { journal, persembahan } = payment;

  return (
    <Panel label="Ringkasan pembayaran">
      <DescriptionList className="px-gutter py-2">
        <DescriptionItem label="Kode">
          <span className="tabular-nums">{payment.code}</span>
        </DescriptionItem>

        <DescriptionItem label="Tujuan">
          {PURPOSE_LABEL[payment.purpose]}
        </DescriptionItem>

        <DescriptionItem label="Nominal">
          <span className="tabular-nums">{formatAmount(payment.amount)}</span>
        </DescriptionItem>

        <DescriptionItem label="Status">
          <PaymentStatusBadge status={payment.status} />
          {isStalePending(payment) ? (
            <span className="text-muted-foreground font-normal">
              {` · ${STALE_PENDING_NOTE}`}
            </span>
          ) : null}
        </DescriptionItem>

        <DescriptionItem label="Metode">
          <OptionalText text={payment.method} empty="Belum terpilih" />
        </DescriptionItem>

        <DescriptionItem label="Dibayar pada">
          {payment.paidAt ? (
            <span className="tabular-nums">
              {formatDateTime(payment.paidAt)}
            </span>
          ) : (
            <OptionalText text={null} empty="Belum dibayar" />
          )}
        </DescriptionItem>

        <DescriptionItem label="Kedaluwarsa pada">
          {payment.expiredAt ? (
            <span className="tabular-nums">
              {formatDateTime(payment.expiredAt)}
            </span>
          ) : (
            <OptionalText text={null} empty="Tanpa batas waktu" />
          )}
        </DescriptionItem>

        <DescriptionItem label="Pemberi" isStacked isWide>
          <span className="block">{giverOf(payment)}</span>
          {payment.jemaat ? (
            <span className="text-muted-foreground block text-caption font-normal tabular-nums">
              {payment.jemaat.code}
            </span>
          ) : null}
        </DescriptionItem>

        <DescriptionItem label="Tipe persembahan">
          <OptionalText
            text={payment.typePersembahan?.name ?? null}
            empty="Tidak ada"
          />
        </DescriptionItem>

        <DescriptionItem label="Periode">
          {payment.period ? (
            periodFormat.format(new Date(payment.period))
          ) : (
            <OptionalText text={null} empty="Tanpa periode" />
          )}
        </DescriptionItem>

        {persembahan ? (
          <DescriptionItem label="Persembahan">
            {isPersembahanLinked ? (
              <Link
                href={persembahanHref(persembahan.code)}
                className={`${TEXT_LINK} tabular-nums`}
              >
                {persembahan.code}
              </Link>
            ) : (
              <span className="tabular-nums">{persembahan.code}</span>
            )}
          </DescriptionItem>
        ) : null}

        {journal ? (
          <DescriptionItem label="Entri jurnal">
            {isJournalLinked ? (
              <Link
                href={journalHref(journal.publicId)}
                className={`${TEXT_LINK} tabular-nums`}
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
      </DescriptionList>
    </Panel>
  );
};
