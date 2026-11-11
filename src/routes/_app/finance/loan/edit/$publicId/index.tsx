import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import { PinjamanFormScreen } from "@/features/keuangan/pinjaman";

function Page() {
  const { publicId } = Route.useParams();

  return (
    <PageContainer size="full">
      <Suspense fallback={<LoadingGlobal />}>
        <PinjamanFormScreen publicId={publicId} />
      </Suspense>
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/finance/loan/edit/$publicId/")({
  head: () => ({ meta: [{ title: withSiteName("Ubah Pinjaman") }] }),
  component: Page,
});
