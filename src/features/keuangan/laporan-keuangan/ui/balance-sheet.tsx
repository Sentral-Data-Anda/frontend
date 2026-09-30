"use client";

import { Landmark, Scale, TrendingUp, Wallet } from "lucide-react";
import Link from "next/link";

import { DateField, buttonVariants } from "@/components/common/control";
import {
  DashboardGrid,
  KpiCell,
  KpiStrip,
} from "@/components/common/dashboard";
import { EmptyState } from "@/components/common/feedback";
import { FormField } from "@/components/common/form";
import { MENU, createHref, menuHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { todayJakarta } from "@/lib/date";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

import { useNeraca } from "../api";
import { SURPLUS_HINT, accountHref, ledgerHref, money } from "../model";

import { AccountTreePanel } from "./account-tree-panel";
import { ReportBanners } from "./report-banners";
import { ReportError } from "./report-error";
import { ReportFilters } from "./report-filters";
import { SurplusRow } from "./surplus-row";

interface PropTypes {
  date: string;
  month: string;
  onPickDate: (value: string) => void;
}

export const BalanceSheet = (props: PropTypes) => {
  const { date, month, onPickDate } = props;

  const accountAccess = useMenuAccess(MENU.AKUN);
  const neraca = useNeraca(date);
  const report = neraca.data;
  const query = {
    isPending: neraca.isPending,
    isFetching: neraca.isFetching,
    error: neraca.error,
    refetch: neraca.refetch,
  };
  const state = { isLoading: neraca.isPending, isError: Boolean(neraca.error) };
  const isChartEmpty =
    report !== undefined &&
    report.assets.length === 0 &&
    report.liabilities.length === 0 &&
    report.equity.length === 0;
  const toLedger = (code: string) => ledgerHref(code, month);
  const toAccount = accountAccess.isCanView ? accountHref : undefined;

  return (
    <div className="pb-6">
      <ReportFilters>
        <FormField label="Posisi tanggal" htmlFor="neraca-date">
          <DateField
            value={date}
            onValueChange={onPickDate}
            max={todayJakarta()}
            isClearable={false}
            label="Posisi tanggal"
          />
        </FormField>
      </ReportFilters>

      <h2 className="hidden px-gutter pb-3 text-lead font-semibold print:block">
        Neraca per {formatDate(date)}
      </h2>

      <ReportBanners neraca={report} />

      {query.error ? (
        <ReportError title="Neraca gagal dimuat." query={query} />
      ) : isChartEmpty ? (
        <EmptyState
          title="Belum ada akun"
          description="Daftar akun adalah dasar seluruh pembukuan. Neraca baru punya isi setelah akun dan saldo awal dimasukkan."
          action={
            accountAccess.isCanCreate ? (
              <Link
                href={createHref(MENU.KEUANGAN, MENU.AKUN)}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "cursor-pointer",
                )}
              >
                Tambah akun
              </Link>
            ) : accountAccess.isCanView ? (
              <Link
                href={menuHref(MENU.KEUANGAN, MENU.AKUN)}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "cursor-pointer",
                )}
              >
                Buka daftar akun
              </Link>
            ) : null
          }
        />
      ) : (
        <div className="px-gutter">
          <DashboardGrid
            kpi={
              <KpiStrip label="Ringkasan neraca">
                <KpiCell
                  label="Aset"
                  icon={Wallet}
                  value={money(report?.totals.assets)}
                  hint="yang dimiliki gereja"
                  {...state}
                />
                <KpiCell
                  label="Kewajiban"
                  icon={Scale}
                  tone="warning"
                  value={money(report?.totals.liabilities)}
                  hint="yang masih harus dibayar"
                  {...state}
                />
                <KpiCell
                  label="Ekuitas"
                  icon={Landmark}
                  tone="secondary"
                  value={money(report?.totals.equity)}
                  hint="saldo awal gereja"
                  {...state}
                />
                <KpiCell
                  label="Surplus/Defisit"
                  icon={TrendingUp}
                  tone="success"
                  value={money(report?.totals.surplus)}
                  hint="sejak awal pencatatan"
                  {...state}
                />
              </KpiStrip>
            }
            main={[
              <AccountTreePanel
                key="assets"
                title="Aset"
                nodes={report?.assets}
                query={query}
                emptyTitle="Belum ada akun aset"
                accountHref={toAccount}
                ledgerHref={toLedger}
              />,
            ]}
            side={[
              <AccountTreePanel
                key="liabilities"
                title="Kewajiban"
                nodes={report?.liabilities}
                query={query}
                emptyTitle="Belum ada akun kewajiban"
                accountHref={toAccount}
                ledgerHref={toLedger}
              />,
              <AccountTreePanel
                key="equity"
                title="Ekuitas"
                nodes={report?.equity}
                query={query}
                emptyTitle="Belum ada akun ekuitas"
                accountHref={toAccount}
                ledgerHref={toLedger}
              />,
              <SurplusRow
                key="surplus"
                total={report?.totals.surplus}
                hint={SURPLUS_HINT}
                query={query}
              />,
            ]}
          />
        </div>
      )}
    </div>
  );
};
