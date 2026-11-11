import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import {
  ExpenseListScreen,
  expenseTable,
} from "@/features/keuangan/kas-keluar/list";

function Page() {
  return (
    <PageContainer size="full">
      <Suspense
        fallback={<LoadingDataList shape="trailing" table={expenseTable()} />}
      >
        <ExpenseListScreen />
      </Suspense>
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/finance/kas-keluar/")({
  head: () => ({ meta: [{ title: withSiteName("Kas Keluar") }] }),
  component: Page,
});
