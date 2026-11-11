import { createFileRoute } from "@tanstack/react-router";

import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import { ReceiptDetailScreen } from "@/features/pengadaan/penerimaan-barang/detail";

function Page() {
  const { code } = Route.useParams();

  return (
    <PageContainer size="full">
      <ReceiptDetailScreen code={code} />
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/procurement/goods-receipt/$code/")({
  head: () => ({ meta: [{ title: withSiteName("Goods Receipt") }] }),
  component: Page,
});
