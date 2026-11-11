import { createFileRoute } from "@tanstack/react-router";

import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import { DisposalDetailScreen } from "@/features/inventaris/siklus-aset/detail";

function Page() {
  const { code } = Route.useParams();

  return (
    <PageContainer size="full">
      <DisposalDetailScreen code={code} />
    </PageContainer>
  );
}

export const Route = createFileRoute(
  "/_app/fixed-asset/asset-transaction/pelepasan/$code/",
)({
  head: () => ({ meta: [{ title: withSiteName("Pelepasan Barang") }] }),
  component: Page,
});
