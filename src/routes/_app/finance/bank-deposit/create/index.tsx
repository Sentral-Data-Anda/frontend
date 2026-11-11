import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { withSiteName } from "@/config/site";
import { TransferFormScreen } from "@/features/keuangan/setoran/form";

function Page() {
  return (
    <Suspense fallback={<LoadingGlobal />}>
      <TransferFormScreen />
    </Suspense>
  );
}

export const Route = createFileRoute("/_app/finance/bank-deposit/create/")({
  head: () => ({ meta: [{ title: withSiteName("Catat Bank Deposit") }] }),
  component: Page,
});
