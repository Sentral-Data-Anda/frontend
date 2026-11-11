import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import { AccountListScreen, accountTable } from "@/features/keuangan/akun/list";

function Page() {
  return (
    <PageContainer size="full">
      <Suspense fallback={<LoadingDataList table={accountTable()} />}>
        <AccountListScreen />
      </Suspense>
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/finance/chart-of-account/")({
  head: () => ({ meta: [{ title: withSiteName("Chart of Account") }] }),
  component: Page,
});
