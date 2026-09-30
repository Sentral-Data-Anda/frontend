"use client";

import { SelectField } from "@/components/common/control";
import { DashboardGrid } from "@/components/common/dashboard";
import { FormField } from "@/components/common/form";
import { MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { monthOptions, monthRange } from "@/lib/date";

import { useSurplusDefisit } from "../api";
import { accountHref, ledgerHref } from "../model";

import { AccountTreePanel } from "./account-tree-panel";
import { ReportError } from "./report-error";
import { ReportFilters } from "./report-filters";
import { SurplusRow } from "./surplus-row";

interface PropTypes {
  month: string;
  onPickMonth: (value: string) => void;
}

export const IncomeStatement = (props: PropTypes) => {
  const { month, onPickMonth } = props;

  const accountAccess = useMenuAccess(MENU.AKUN);
  const options = monthOptions();
  const range = monthRange(month);
  const surplus = useSurplusDefisit(range.startDate, range.endDate);
  const report = surplus.data;
  const query = {
    isPending: surplus.isPending,
    isFetching: surplus.isFetching,
    error: surplus.error,
    refetch: surplus.refetch,
  };
  const label =
    options.find((option) => option.value === month)?.label ?? month;
  const toLedger = (code: string) => ledgerHref(code, month);
  const toAccount = accountAccess.isCanView ? accountHref : undefined;

  return (
    <div className="pb-6">
      <ReportFilters>
        <FormField label="Bulan" htmlFor="laba-rugi-month">
          <SelectField
            value={month}
            onValueChange={onPickMonth}
            options={options}
          />
        </FormField>
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
