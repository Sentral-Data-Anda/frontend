import { createFileRoute } from "@tanstack/react-router";

import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import { TransferDetailScreen } from "@/features/inventaris/siklus-aset/detail";

function Page() {
  const { code } = Route.useParams();

  return (
    <PageContainer size="full">
      <TransferDetailScreen code={code} />
    </PageContainer>
  );
}

export const Route = createFileRoute(
  "/_app/fixed-asset/asset-transaction/pindah/$code/",
)({
  head: () => ({ meta: [{ title: withSiteName("Pindah Lokasi") }] }),
  component: Page,
});
