import { createFileRoute } from "@tanstack/react-router";

import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import { StockDetailScreen } from "@/features/inventaris/barang-persediaan/detail";

function Page() {
  const { code } = Route.useParams();

  return (
    <PageContainer size="full">
      <StockDetailScreen code={code} />
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/inventory/stock-item/$code/")({
  head: () => ({ meta: [{ title: withSiteName("Stock Item") }] }),
  component: Page,
});
