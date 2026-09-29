"use client";

import Link from "next/link";

import { formatDateShort } from "@/lib/format";

import type { useRatePreview } from "../api";
import { TEXT_LINK, currencyHref, formatRate, isRateStale } from "../model";

interface PropTypes {
  currencyCode: string;
  orderDate: string;
  preview: ReturnType<typeof useRatePreview>;
  isCanFillRate: boolean;
  isFieldInvalid: boolean;
}

export const RateHint = (props: PropTypes) => {
  const { currencyCode, orderDate, preview, isCanFillRate, isFieldInvalid } =
    props;

  const fillLink = isCanFillRate ? (
    <Link href={currencyHref(currencyCode)} className={TEXT_LINK}>
      Isi kurs di Mata Uang
    </Link>
  ) : null;

  if (!preview.isEnabled) return null;

  if (preview.isMissing) {
    if (isFieldInvalid && !fillLink) return null;

    return (
      <p role="status" className="text-destructive mt-1.5 text-body">
        {isFieldInvalid
          ? null
          : `Belum ada kurs ${currencyCode} untuk tanggal ini. `}
        {fillLink}
      </p>
    );
  }

  if (preview.isFailed) {
    return (
      <p className="text-muted-foreground mt-1.5 text-caption">
        Kurs belum bisa dimuat. Server tetap memakai kurs terakhir saat
        menyimpan.
      </p>
    );
  }

  if (!preview.rate) {
    return (
      <p className="text-muted-foreground mt-1.5 text-caption">Memuat kurs…</p>
    );
  }

  const { rate, rateDate } = preview.rate;
  const isStale = isRateStale(rateDate, orderDate);

  return (
    <div role="status" className="mt-1.5 space-y-1">
      <p className="text-muted-foreground text-caption tabular-nums">
        {`Kurs ${formatRate(rate)} · ${formatDateShort(rateDate)} (Mata Uang)`}
      </p>
      {isStale ? (
        <p className="border-warning bg-warning/10 rounded-control border px-2 py-0.5 text-caption">
          {`Kurs terakhir ${formatDateShort(rateDate)}. Perbarui di Mata Uang bila sudah berubah. `}
          {isCanFillRate ? (
            <Link href={currencyHref(currencyCode)} className={TEXT_LINK}>
              Buka Mata Uang
            </Link>
          ) : null}
        </p>
      ) : null}
    </div>
  );
};
