import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import { PayslipScreen } from "@/features/sdm/payroll/detail";

// Nol nama dan nol nominal di judul tab (SDM §0.3 no. 5).
function Page() {
  const { code, slip } = Route.useParams();

  return (
    <PageContainer size="full">
      <Suspense fallback={<LoadingGlobal />}>
        <PayslipScreen code={code} slipCode={slip} />
      </Suspense>
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/hr/payroll/$code/slip/$slip/")({
  head: () => ({ meta: [{ title: withSiteName("Payroll") }] }),
  component: Page,
});
