import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import { PersembahanFormScreen } from "@/features/keuangan/persembahan/form";

function Page() {
  return (
    <PageContainer size="full">
      <Suspense fallback={<LoadingGlobal />}>
        <PersembahanFormScreen />
      </Suspense>
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/finance/persembahan/create/")({
  head: () => ({ meta: [{ title: withSiteName("Catat Persembahan") }] }),
  component: Page,
});
