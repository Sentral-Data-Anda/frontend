import { createFileRoute } from "@tanstack/react-router";

import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import { ReturnDetailScreen } from "@/features/pengadaan/retur-pembelian/detail";

function Page() {
  const { id } = Route.useParams();

  return (
    <PageContainer size="full">
      <ReturnDetailScreen publicId={id} />
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/procurement/purchase-return/$id/")({
  head: () => ({ meta: [{ title: withSiteName("Purchase Return") }] }),
  component: Page,
});
