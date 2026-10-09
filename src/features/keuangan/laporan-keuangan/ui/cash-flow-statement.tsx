"use client";

import Link from "next/link";

import { SelectField, buttonVariants } from "@/components/common/control";
import { Panel } from "@/components/common/display";
import { FormAlert, FormField } from "@/components/common/form";
import { MENU, menuHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { FetchError } from "@/lib/api/fetcher";
import { monthOptions, monthRange } from "@/lib/date";
import { cn } from "@/lib/utils";

import { useArusKas } from "../api";
import {
  CASH_FLOW_DERIVED_MESSAGE,
  CASH_FLOW_DERIVED_TITLE,
  CASH_FLOW_NO_ACCOUNT_MESSAGE,
  CASH_FLOW_NO_ACCOUNT_TITLE,
  CASH_FLOW_SECTION_LABEL,
  money,
} from "../model";
import type { CashFlowSection } from "../types";

import { ReportError } from "./report-error";
import { ReportFilters } from "./report-filters";

interface PropTypes {
  month: string;
  onPickMonth: (value: string) => void;
}

const SECTIONS: CashFlowSection[] = ["OPERASI", "INVESTASI", "PENDANAAN"];

const AKUN_PATH = menuHref(MENU.FINANCE, MENU.CHART_OF_ACCOUNT);

const AMOUNT = "shrink-0 pl-3 text-right tabular-nums";

export const CashFlowStatement = (props: PropTypes) => {
  const { month, onPickMonth } = props;

  const accountAccess = useMenuAccess(MENU.CHART_OF_ACCOUNT);
  const options = monthOptions();
  const range = monthRange(month);
  const report = useArusKas(range.startDate, range.endDate);
  const data = report.data;
  const query = {
    isPending: report.isPending,
    isFetching: report.isFetching,
    error: report.error,
    refetch: report.refetch,
  };
  const label =
    options.find((option) => option.value === month)?.label ?? month;

  // Satu-satunya laporan di modul ini yang menolak, dan penolakannya punya
  // perbaikan yang jelas — jadi dia tidak boleh jatuh ke layar galat umum,
  // yang hanya menawarkan "Coba lagi" pada hal yang tidak akan berubah.
  const isNoCashAccount =
    report.error instanceof FetchError && report.error.status === 400;

  const totalOf = (section: CashFlowSection) =>
    section === "OPERASI"
      ? data?.sections.operasi
      : section === "INVESTASI"
        ? data?.sections.investasi
        : data?.sections.pendanaan;

  return (
    <div className="pb-6">
      <ReportFilters>
        <FormField label="Bulan" htmlFor="arus-kas-month">
          <SelectField
            value={month}
            onValueChange={onPickMonth}
            options={options}
          />
        </FormField>
      </ReportFilters>

      <h2 className="hidden px-gutter pb-3 text-lead font-semibold print:block">
        Laporan Arus Kas {label}
      </h2>

      {isNoCashAccount ? (
        <div className="flex flex-col items-start gap-2 px-gutter">
          <FormAlert
            tone="warning"
            title={CASH_FLOW_NO_ACCOUNT_TITLE}
            message={CASH_FLOW_NO_ACCOUNT_MESSAGE}
          />
          {accountAccess.isCanView ? (
            <Link
              href={AKUN_PATH}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "cursor-pointer",
              )}
            >
              Buka Akun
            </Link>
          ) : null}
        </div>
      ) : query.error ? (
        <ReportError title="Arus Kas gagal dimuat." query={query} />
      ) : (
        <div className="space-y-3 px-gutter">
          {data?.isDerived ? (
            <FormAlert
              tone="warning"
              title={CASH_FLOW_DERIVED_TITLE}
              message={CASH_FLOW_DERIVED_MESSAGE}
            />
          ) : null}

          <Panel>
            <dl className="divide-border/60 divide-y">
              <div className="flex items-baseline justify-between px-gutter py-2.5">
                <dt className="min-w-0">Kas dan setara kas awal</dt>
                <dd className={AMOUNT}>{money(data?.openingCash)}</dd>
              </div>

              {SECTIONS.map((section) => (
                <div key={section} className="px-gutter py-2.5">
                  <div className="flex items-baseline justify-between font-medium">
                    <span className="min-w-0">
                      {CASH_FLOW_SECTION_LABEL[section]}
                    </span>
                    <span className={AMOUNT}>{money(totalOf(section))}</span>
                  </div>

                  <ul className="mt-1 space-y-0.5">
                    {(data?.lines ?? [])
                      .filter((line) => line.section === section)
                      .map((line) => (
                        <li
                          key={line.code}
                          className="text-muted-foreground flex items-baseline justify-between text-caption"
                        >
                          <span className="min-w-0 truncate">
                            {line.code} — {line.name}
                          </span>
                          <span className={AMOUNT}>{money(line.amount)}</span>
                        </li>
                      ))}

                    {data &&
                    !data.lines.some((line) => line.section === section) ? (
                      <li className="text-muted-foreground text-caption">
                        Tidak ada pergerakan.
                      </li>
                    ) : null}
                  </ul>
                </div>
              ))}

              <div className="flex items-baseline justify-between px-gutter py-2.5 font-medium">
                <dt className="min-w-0">Kenaikan (penurunan) kas</dt>
                <dd className={AMOUNT}>{money(data?.change)}</dd>
              </div>

              <div className="flex items-baseline justify-between px-gutter py-2.5 font-semibold">
                <dt className="min-w-0">Kas dan setara kas akhir</dt>
                <dd className={AMOUNT}>{money(data?.closingCash)}</dd>
              </div>
            </dl>
          </Panel>

          {/* Akun mana yang dihitung sebagai kas. Tanpa ini saldo akhir di sini
              yang berbeda dari Neraca tidak bisa ditelusuri siapa pun. */}
          {data?.cashAccounts.length ? (
            <p className="text-muted-foreground text-caption">
              Kas dan setara kas:{" "}
              {data.cashAccounts.map((account) => account.name).join(", ")}.
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
};
