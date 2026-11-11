import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import { ReceiptDetailScreen } from "@/features/keuangan/kas-masuk/detail";

function Page() {
  const { id } = Route.useParams();

  return (
    <PageContainer size="full">
      <Suspense fallback={<LoadingGlobal />}>
        <ReceiptDetailScreen publicId={id} />
      </Suspense>
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/finance/kas-masuk/$id/")({
  head: () => ({ meta: [{ title: withSiteName("Kas Masuk") }] }),
  component: Page,
});
