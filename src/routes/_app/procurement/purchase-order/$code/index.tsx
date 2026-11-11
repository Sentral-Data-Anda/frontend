import { createFileRoute } from "@tanstack/react-router";

import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import { OrderDetailScreen } from "@/features/pengadaan/pesanan-pembelian/detail";

function Page() {
  const { code } = Route.useParams();

  return (
    <PageContainer size="full">
      <OrderDetailScreen code={code} />
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/procurement/purchase-order/$code/")(
  {
    head: () => ({ meta: [{ title: withSiteName("Purchase Order") }] }),
    component: Page,
  },
);
