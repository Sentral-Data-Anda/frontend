import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import { KolekteScreen } from "@/features/keuangan/persembahan/form";

function Page() {
  return (
    <PageContainer size="full">
      <Suspense fallback={<LoadingGlobal />}>
        <KolekteScreen />
      </Suspense>
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/finance/persembahan/kolekte/")({
  head: () => ({ meta: [{ title: withSiteName("Catat Kolekte") }] }),
  component: Page,
});
