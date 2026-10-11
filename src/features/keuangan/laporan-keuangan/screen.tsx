"use client";

import { Printer } from "lucide-react";

import { Button } from "@/components/common/control";
import { EmptyState } from "@/components/common/feedback";
import { ListTabs } from "@/components/common/list";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useListParams, type ListFilterSchema } from "@/hooks/use-list-params";

import {
  NO_VIEW_DESCRIPTION,
  NO_VIEW_TITLE,
  readDate,
  readRange,
  readTab,
} from "./model";
import { REPORT_TABS } from "./types";
import {
  BalanceSheet,
  CashFlowStatement,
  GeneralLedger,
  IncomeStatement,
  NetAssetStatement,
} from "./ui";

const REPORT_FILTERS = {
  tab: { api: "tab" },
  tanggal: { api: "tanggal" },
  dari: { api: "dari" },
  sampai: { api: "sampai" },
  akun: { api: "akun" },
} satisfies ListFilterSchema;

export const LaporanKeuanganScreen = () => {
  const { isCanView } = useMenuAccess(MENU.FINANCIAL_STATEMENT);
  const listParams = useListParams({ filters: REPORT_FILTERS });
  const tab = readTab(listParams.filters.tab);
  const date = readDate(listParams.filters.tanggal);
  const range = readRange(listParams.filters.dari, listParams.filters.sampai);

  const onPickFilter = (key: string) => (value: string) =>
    listParams.onPickFilter(key, value);

  return (
    <div className="pb-6">
      <PageHeader
        title="Financial Statement"
        backHref={domainHref(MENU.REPORT)}
        action={
          isCanView ? (
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer"
              onClick={() => window.print()}
            >
              <Printer aria-hidden />
              Cetak
            </Button>
          ) : null
        }
      />

      {!isCanView ? (
        <EmptyState title={NO_VIEW_TITLE} description={NO_VIEW_DESCRIPTION} />
      ) : (
        <>
          <ListTabs
            label="Laporan keuangan"
            value={tab}
            options={REPORT_TABS}
            onValueChange={onPickFilter("tab")}
          />

          {tab === "neraca" ? (
            <BalanceSheet
              date={date}
              range={range}
              onPickDate={onPickFilter("tanggal")}
            />
          ) : null}

          {tab === "laba-rugi" ? (
            <IncomeStatement
              range={range}
              onPickFrom={onPickFilter("dari")}
              onPickTo={onPickFilter("sampai")}
            />
          ) : null}

          {tab === "aset-neto" ? (
            <NetAssetStatement
              range={range}
              onPickFrom={onPickFilter("dari")}
              onPickTo={onPickFilter("sampai")}
            />
          ) : null}

          {tab === "arus-kas" ? (
            <CashFlowStatement
              range={range}
              onPickFrom={onPickFilter("dari")}
              onPickTo={onPickFilter("sampai")}
            />
          ) : null}

          {tab === "buku-besar" ? (
            <GeneralLedger
              code={listParams.filters.akun}
              range={range}
              page={listParams.page}
              limit={listParams.limit}
              onPickAccount={onPickFilter("akun")}
              onPickFrom={onPickFilter("dari")}
              onPickTo={onPickFilter("sampai")}
              onPickPage={listParams.onPickPage}
              onPickLimit={listParams.onPickLimit}
            />
          ) : null}
        </>
      )}
    </div>
  );
};
