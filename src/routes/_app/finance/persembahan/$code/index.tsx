import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import { PersembahanDetailScreen } from "@/features/keuangan/persembahan/detail";

function Page() {
  const { code } = Route.useParams();

  return (
    <PageContainer size="full">
      <Suspense fallback={<LoadingGlobal />}>
        <PersembahanDetailScreen code={code} />
      </Suspense>
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/finance/persembahan/$code/")({
  head: () => ({ meta: [{ title: withSiteName("Persembahan") }] }),
  component: Page,
});
