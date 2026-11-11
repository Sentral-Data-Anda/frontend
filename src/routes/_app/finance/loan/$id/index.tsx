import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import { PinjamanDetailScreen } from "@/features/keuangan/pinjaman";

function Page() {
  const { id } = Route.useParams();

  return (
    <PageContainer size="full">
      <Suspense fallback={<LoadingGlobal />}>
        <PinjamanDetailScreen publicId={id} />
      </Suspense>
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/finance/loan/$id/")({
  head: () => ({ meta: [{ title: withSiteName("Pinjaman") }] }),
  component: Page,
});
