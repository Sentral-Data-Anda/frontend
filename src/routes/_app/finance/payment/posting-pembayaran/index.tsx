import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { withSiteName } from "@/config/site";
import { PostingPembayaranScreen } from "@/features/keuangan/pembayaran/posting";

function Page() {
  return (
    <Suspense fallback={<LoadingGlobal />}>
      <PostingPembayaranScreen />
    </Suspense>
  );
}

export const Route = createFileRoute(
  "/_app/finance/payment/posting-pembayaran/",
)({
  head: () => ({ meta: [{ title: withSiteName("Posting Pembayaran Event") }] }),
  component: Page,
});
