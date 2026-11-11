import { createFileRoute } from "@tanstack/react-router";

import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import { OpnameDetailScreen } from "@/features/inventaris/stok-opname/detail";

function Page() {
  const { code } = Route.useParams();

  return (
    <PageContainer size="full">
      <OpnameDetailScreen code={code} />
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/inventory/stok-opname/$code/")({
  head: () => ({ meta: [{ title: withSiteName("Stok Opname") }] }),
  component: Page,
});
