import { createFileRoute } from "@tanstack/react-router";

import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import { ActivityLogDetailScreen } from "@/features/pengaturan/activity-log/detail";

function Page() {
  const { id } = Route.useParams();

  return (
    <PageContainer size="full">
      <ActivityLogDetailScreen id={id} />
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/settings/activity-log/$id/")({
  head: () => ({ meta: [{ title: withSiteName("Detail Activity Log") }] }),
  component: Page,
});
