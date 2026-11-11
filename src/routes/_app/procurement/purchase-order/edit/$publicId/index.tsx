import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { withSiteName } from "@/config/site";
import { OrderFormScreen } from "@/features/pengadaan/pesanan-pembelian/form";

function Page() {
  const { publicId } = Route.useParams();

  return (
    <Suspense fallback={<LoadingGlobal />}>
      <OrderFormScreen code={publicId} />
    </Suspense>
  );
}

export const Route = createFileRoute(
  "/_app/procurement/purchase-order/edit/$publicId/",
)({
  head: () => ({ meta: [{ title: withSiteName("Ubah Purchase Order") }] }),
  component: Page,
});
