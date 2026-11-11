import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { withSiteName } from "@/config/site";
import { ReceiptFormScreen } from "@/features/keuangan/kas-masuk/form";

function Page() {
  return (
    <Suspense fallback={<LoadingGlobal />}>
      <ReceiptFormScreen />
    </Suspense>
  );
}

export const Route = createFileRoute("/_app/finance/kas-masuk/create/")({
  head: () => ({ meta: [{ title: withSiteName("Tambah Kas Masuk") }] }),
  component: Page,
});
