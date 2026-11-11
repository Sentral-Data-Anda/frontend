import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { withSiteName } from "@/config/site";
import { ReturnFormScreen } from "@/features/pengadaan/retur-pembelian/form";

function Page() {
  return (
    <Suspense fallback={<LoadingGlobal />}>
      <ReturnFormScreen />
    </Suspense>
  );
}

export const Route = createFileRoute(
  "/_app/procurement/purchase-return/create/",
)({
  head: () => ({ meta: [{ title: withSiteName("Tambah Purchase Return") }] }),
  component: Page,
});
