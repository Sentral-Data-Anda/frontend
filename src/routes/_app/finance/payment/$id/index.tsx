import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import { PaymentDetailScreen } from "@/features/keuangan/pembayaran/detail";

function Page() {
  const { id } = Route.useParams();

  return (
    <PageContainer size="full">
      <Suspense fallback={<LoadingGlobal />}>
        <PaymentDetailScreen publicId={id} />
      </Suspense>
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/finance/payment/$id/")({
  head: () => ({ meta: [{ title: withSiteName("Payment") }] }),
  component: Page,
});
