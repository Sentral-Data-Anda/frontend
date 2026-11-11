import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import { PayrollDetailScreen } from "@/features/sdm/payroll/detail";

function Page() {
  const { code } = Route.useParams();

  return (
    <PageContainer size="full">
      <Suspense fallback={<LoadingGlobal />}>
        <PayrollDetailScreen code={code} />
      </Suspense>
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/hr/payroll/$code/")({
  head: () => ({ meta: [{ title: withSiteName("Payroll") }] }),
  component: Page,
});
