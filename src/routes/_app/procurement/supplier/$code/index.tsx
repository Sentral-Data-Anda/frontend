import { createFileRoute } from "@tanstack/react-router";

import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import { SupplierDetailScreen } from "@/features/pengadaan/supplier/detail";

function Page() {
  const { code } = Route.useParams();

  return (
    <PageContainer size="full">
      <SupplierDetailScreen code={code} />
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/procurement/supplier/$code/")({
  head: () => ({ meta: [{ title: withSiteName("Supplier") }] }),
  component: Page,
});
