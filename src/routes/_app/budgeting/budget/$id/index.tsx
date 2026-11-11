import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import { AllocationDetailScreen } from "@/features/anggaran/pagu-anggaran/detail";

function Page() {
  const { id } = Route.useParams();

  return (
    <PageContainer size="full">
      <Suspense fallback={<LoadingGlobal />}>
        <AllocationDetailScreen publicId={id} />
      </Suspense>
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/budgeting/budget/$id/")({
  head: () => ({ meta: [{ title: withSiteName("Budget") }] }),
  component: Page,
});
