import { createFileRoute } from "@tanstack/react-router";

import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import { PenyusutanDetailScreen } from "@/features/inventaris/penyusutan/detail";

function Page() {
  const { code } = Route.useParams();

  return (
    <PageContainer size="full">
      <PenyusutanDetailScreen code={code} />
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/fixed-asset/depreciation/$code/")({
  head: () => ({ meta: [{ title: withSiteName("Depreciation") }] }),
  component: Page,
});
