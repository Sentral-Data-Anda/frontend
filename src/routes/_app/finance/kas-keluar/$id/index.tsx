import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import { ExpenseDetailScreen } from "@/features/keuangan/kas-keluar/detail";

function Page() {
  const { id } = Route.useParams();

  return (
    <PageContainer size="full">
      <Suspense fallback={<LoadingGlobal />}>
        <ExpenseDetailScreen publicId={id} />
      </Suspense>
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/finance/kas-keluar/$id/")({
  head: () => ({ meta: [{ title: withSiteName("Kas Keluar") }] }),
  component: Page,
});
