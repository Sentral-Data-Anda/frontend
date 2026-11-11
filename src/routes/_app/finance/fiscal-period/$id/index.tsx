import { createFileRoute } from "@tanstack/react-router";

import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import { PeriodDetailScreen } from "@/features/keuangan/periode-fiskal/detail";

function Page() {
  const { id } = Route.useParams();

  return (
    <PageContainer size="full">
      <PeriodDetailScreen id={id} />
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/finance/fiscal-period/$id/")({
  head: () => ({ meta: [{ title: withSiteName("Fiscal Period") }] }),
  component: Page,
});
