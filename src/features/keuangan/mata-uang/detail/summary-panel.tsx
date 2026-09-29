import { Plus } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/common/control";
import {
  DescriptionItem,
  DescriptionList,
  Panel,
} from "@/components/common/display";
import { FormAlert } from "@/components/common/form";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

import {
  STALE_RATE_DAYS,
  formatRate,
  rateAgeOf,
  rateCreateHref,
} from "../model";
import type { Currency } from "../types";

interface PropTypes {
  currency: Currency;
  isCanCreate: boolean;
}

export const SummaryPanel = (props: PropTypes) => {
  const { currency, isCanCreate } = props;

  const { latestRate } = currency;
  const age = latestRate ? rateAgeOf(latestRate.rateDate) : 0;
  const isStale = latestRate !== null && age > STALE_RATE_DAYS;

  return (
    <Panel label="Ringkasan mata uang">
      <div className="flex flex-wrap items-end justify-between gap-4 px-gutter pt-4">
        <div className="min-w-0">
          <p className="text-muted-foreground text-body">
            {currency.isBase ? "Mata uang dasar" : "Kurs terakhir"}
          </p>

          {currency.isBase ? (
            <p className="text-kpi font-semibold tracking-tight">
              1 Rupiah = 1 Rupiah
            </p>
          ) : latestRate ? (
            <p className="flex flex-wrap items-baseline gap-x-2">
              <span className="text-kpi font-semibold tracking-tight wrap-break-word tabular-nums">
                {formatRate(latestRate.rate)}
              </span>
              <span className="text-lead">per 1 {currency.code}</span>
            </p>
          ) : (
            <p className="text-muted-foreground text-kpi font-semibold tracking-tight">
              Belum ada kurs
            </p>
          )}

          <p className="text-muted-foreground mt-1 text-body">
            {currency.isBase
              ? "Rupiah adalah mata uang dasar, jadi tidak punya kurs."
              : latestRate
                ? `Kurs tanggal ${formatDate(latestRate.rateDate)}`
                : `Pesanan dalam ${currency.code} belum bisa disimpan sebelum kurs diisi.`}
          </p>
        </div>

        {isCanCreate && !currency.isBase ? (
          <Link
            href={rateCreateHref(currency.code)}
            className={cn(buttonVariants(), "shrink-0 cursor-pointer")}
          >
            <Plus aria-hidden />
            Tambah kurs
          </Link>
        ) : null}
      </div>

      {isStale ? (
        <div className="px-gutter pt-4">
          <FormAlert
            tone="warning"
            title={`Kurs sudah ${age} hari`}
            message={`Pesanan memakai kurs terakhir sebelum tanggal pesanan. Tambah kurs baru bila ${currency.code} sudah berubah.`}
          />
        </div>
      ) : null}

      <DescriptionList className="px-gutter pt-2 pb-2">
        <DescriptionItem label="Kode">{currency.code}</DescriptionItem>
        <DescriptionItem label="Nama">{currency.name}</DescriptionItem>
        <DescriptionItem label="Simbol">{currency.symbol}</DescriptionItem>
      </DescriptionList>
    </Panel>
  );
};
