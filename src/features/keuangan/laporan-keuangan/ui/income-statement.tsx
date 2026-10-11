"use client";

import { DashboardGrid } from "@/components/common/dashboard";
import { MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";

import { useSurplusDefisit } from "../api";
import { accountHref, ledgerHref, rangeLabel } from "../model";
import type { ReportRange } from "../types";

import { AccountTreePanel } from "./account-tree-panel";
import { PeriodFields } from "./period-fields";
import { ReportError } from "./report-error";
import { ReportFilters } from "./report-filters";
import { SurplusRow } from "./surplus-row";

interface PropTypes {
  range: ReportRange;
  onPickFrom: (value: string) => void;
  onPickTo: (value: string) => void;
}

export const IncomeStatement = (props: PropTypes) => {
  const { range, onPickFrom, onPickTo } = props;

  const accountAccess = useMenuAccess(MENU.CHART_OF_ACCOUNT);
  const surplus = useSurplusDefisit(range.from, range.to);
  const report = surplus.data;
  const query = {
    isPending: surplus.isPending,
    isFetching: surplus.isFetching,
    error: surplus.error,
    refetch: surplus.refetch,
  };
  const label = rangeLabel(range);
  const toLedger = (code: string) => ledgerHref(code, range);
  const toAccount = accountAccess.isCanView ? accountHref : undefined;

  return (
    <div className="pb-6">
      <ReportFilters>
        <PeriodFields
          idPrefix="laba-rugi"
          range={range}
          onPickFrom={onPickFrom}
          onPickTo={onPickTo}
        />
      </ReportFilters>

      <h2 className="hidden px-gutter pb-3 text-lead font-semibold print:block">
        Laba Rugi {label}
      </h2>

      {query.error ? (
        <ReportError title="Laba Rugi gagal dimuat." query={query} />
      ) : (
        <div className="px-gutter">
          <DashboardGrid
            main={[
              <AccountTreePanel
                key="income"
                title="Pendapatan"
                nodes={report?.income}
                total={report?.totals.income}
                query={query}
                emptyTitle="Belum ada akun pendapatan"
                accountHref={toAccount}
                ledgerHref={toLedger}
              />,
            ]}
            side={[
              <AccountTreePanel
                key="expense"
                title="Beban"
                nodes={report?.expense}
                total={report?.totals.expense}
                query={query}
                emptyTitle="Belum ada akun beban"
                accountHref={toAccount}
                ledgerHref={toLedger}
              />,
              <SurplusRow
                key="surplus"
                total={report?.totals.surplus}
                hint={`Pendapatan dikurangi beban, ${label}.`}
                query={query}
              />,
            ]}
          />
        </div>
      )}
    </div>
  );
};
