import { createFileRoute } from "@tanstack/react-router";

import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import { PermintaanDetailScreen } from "@/features/persetujuan/permintaan-persetujuan/detail";

function Page() {
  const { id } = Route.useParams();

  return (
    <PageContainer size="full">
      <PermintaanDetailScreen id={id} />
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/approval/approval-request/$id/")({
  head: () => ({ meta: [{ title: withSiteName("Detail Approval Request") }] }),
  component: Page,
});
