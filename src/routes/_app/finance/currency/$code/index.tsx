import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import { CurrencyDetailScreen } from "@/features/keuangan/mata-uang/detail";

function Page() {
  const { code } = Route.useParams();

  return (
    <PageContainer size="full">
      <Suspense fallback={<LoadingGlobal />}>
        <CurrencyDetailScreen code={code} />
      </Suspense>
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/finance/currency/$code/")({
  head: () => ({ meta: [{ title: withSiteName("Currency") }] }),
  component: Page,
});
