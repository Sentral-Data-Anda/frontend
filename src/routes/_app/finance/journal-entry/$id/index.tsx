import { createFileRoute } from "@tanstack/react-router";

import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import { JournalDetailScreen } from "@/features/keuangan/jurnal/detail";

function Page() {
  const { id } = Route.useParams();

  return (
    <PageContainer size="full">
      <JournalDetailScreen publicId={id} />
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/finance/journal-entry/$id/")({
  head: () => ({ meta: [{ title: withSiteName("Journal Entry") }] }),
  component: Page,
});
