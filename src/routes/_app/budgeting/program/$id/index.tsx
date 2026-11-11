import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import { ProgramDetailScreen } from "@/features/anggaran/program/detail";

function Page() {
  const { id } = Route.useParams();

  return (
    <PageContainer size="full">
      <Suspense fallback={<LoadingGlobal />}>
        <ProgramDetailScreen publicId={id} />
      </Suspense>
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/budgeting/program/$id/")({
  head: () => ({ meta: [{ title: withSiteName("Program") }] }),
  component: Page,
});
