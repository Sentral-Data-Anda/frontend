import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import {
  TransferListScreen,
  transferTable,
} from "@/features/keuangan/setoran/list";

function Page() {
  return (
    <PageContainer size="full">
      <Suspense
        fallback={<LoadingDataList shape="trailing" table={transferTable()} />}
      >
        <TransferListScreen />
      </Suspense>
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/finance/bank-deposit/")({
  head: () => ({ meta: [{ title: withSiteName("Bank Deposit") }] }),
  component: Page,
});
