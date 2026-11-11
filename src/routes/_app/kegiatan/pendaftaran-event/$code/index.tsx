import { createFileRoute } from "@tanstack/react-router";

import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import { PendaftaranDetailScreen } from "@/features/kegiatan/pendaftaran-event/detail";

function Page() {
  const { code } = Route.useParams();

  return (
    <PageContainer size="full">
      <PendaftaranDetailScreen code={code} />
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/kegiatan/pendaftaran-event/$code/")(
  {
    head: () => ({ meta: [{ title: withSiteName("Pendaftaran Event") }] }),
    component: Page,
  },
);
