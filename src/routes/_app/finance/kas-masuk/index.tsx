import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import {
  ReceiptListScreen,
  receiptTable,
} from "@/features/keuangan/kas-masuk/list";

function Page() {
  return (
    <PageContainer size="full">
      <Suspense
        fallback={
          <LoadingDataList shape="trailing" table={receiptTable(false)} />
        }
      >
        <ReceiptListScreen />
      </Suspense>
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/finance/kas-masuk/")({
  head: () => ({ meta: [{ title: withSiteName("Kas Masuk") }] }),
  component: Page,
});
