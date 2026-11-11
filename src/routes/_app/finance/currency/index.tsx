import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import {
  CurrencyListScreen,
  currencyTable,
} from "@/features/keuangan/mata-uang/list";

function Page() {
  return (
    <PageContainer size="full">
      <Suspense
        fallback={<LoadingDataList shape="trailing" table={currencyTable()} />}
      >
        <CurrencyListScreen />
      </Suspense>
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/finance/currency/")({
  head: () => ({ meta: [{ title: withSiteName("Currency") }] }),
  component: Page,
});
