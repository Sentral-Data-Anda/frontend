import { createFileRoute } from "@tanstack/react-router";

import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import { RequestDetailScreen } from "@/features/pengadaan/permintaan-pembelian/detail";

function Page() {
  const { code } = Route.useParams();

  return (
    <PageContainer size="full">
      <RequestDetailScreen code={code} />
    </PageContainer>
  );
}

export const Route = createFileRoute(
  "/_app/procurement/purchase-request/$code/",
)({
  head: () => ({ meta: [{ title: withSiteName("Purchase Request") }] }),
  component: Page,
});
