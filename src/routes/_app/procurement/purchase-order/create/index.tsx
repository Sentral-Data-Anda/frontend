import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { withSiteName } from "@/config/site";
import { OrderFormScreen } from "@/features/pengadaan/pesanan-pembelian/form";

function Page() {
  return (
    <Suspense fallback={<LoadingGlobal />}>
      <OrderFormScreen />
    </Suspense>
  );
}

export const Route = createFileRoute(
  "/_app/procurement/purchase-order/create/",
)({
  head: () => ({ meta: [{ title: withSiteName("Tambah Purchase Order") }] }),
  component: Page,
});
