import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { withSiteName } from "@/config/site";
import { RequestFormScreen } from "@/features/pengadaan/permintaan-pembelian/form";

function Page() {
  return (
    <Suspense fallback={<LoadingGlobal />}>
      <RequestFormScreen />
    </Suspense>
  );
}

export const Route = createFileRoute(
  "/_app/procurement/purchase-request/create/",
)({
  head: () => ({ meta: [{ title: withSiteName("Tambah Purchase Request") }] }),
  component: Page,
});
