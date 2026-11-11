import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import {
  PaymentListScreen,
  paymentTable,
} from "@/features/keuangan/pembayaran/list";

function Page() {
  return (
    <PageContainer size="full">
      <Suspense
        fallback={<LoadingDataList shape="trailing" table={paymentTable()} />}
      >
        <PaymentListScreen />
      </Suspense>
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/finance/payment/")({
  head: () => ({ meta: [{ title: withSiteName("Payment") }] }),
  component: Page,
});
