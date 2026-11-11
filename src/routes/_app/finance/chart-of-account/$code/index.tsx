import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import { AccountDetailScreen } from "@/features/keuangan/akun/detail";

function Page() {
  const { code } = Route.useParams();

  return (
    <PageContainer size="full">
      <Suspense fallback={<LoadingGlobal />}>
        <AccountDetailScreen code={code} />
      </Suspense>
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/finance/chart-of-account/$code/")({
  head: () => ({ meta: [{ title: withSiteName("Chart of Account") }] }),
  component: Page,
});
