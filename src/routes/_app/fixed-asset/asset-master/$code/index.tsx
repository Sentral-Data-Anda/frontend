import { createFileRoute } from "@tanstack/react-router";

import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import { BarangDetailScreen } from "@/features/inventaris/barang/detail";

function Page() {
  const { code } = Route.useParams();

  return (
    <PageContainer size="full">
      <BarangDetailScreen code={code} />
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/fixed-asset/asset-master/$code/")({
  head: () => ({ meta: [{ title: withSiteName("Asset Master") }] }),
  component: Page,
});
