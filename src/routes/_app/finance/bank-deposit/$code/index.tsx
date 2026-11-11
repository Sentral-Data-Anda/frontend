import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import { TransferDetailScreen } from "@/features/keuangan/setoran/detail";

function Page() {
  const { code } = Route.useParams();

  return (
    <PageContainer size="full">
      <Suspense fallback={<LoadingGlobal />}>
        <TransferDetailScreen code={code} />
      </Suspense>
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/finance/bank-deposit/$code/")({
  head: () => ({ meta: [{ title: withSiteName("Bank Deposit") }] }),
  component: Page,
});
