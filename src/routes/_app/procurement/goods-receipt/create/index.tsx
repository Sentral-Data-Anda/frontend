import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { withSiteName } from "@/config/site";
import { ReceiptFormScreen } from "@/features/pengadaan/penerimaan-barang/form";

function Page() {
  return (
    <Suspense fallback={<LoadingGlobal />}>
      <ReceiptFormScreen />
    </Suspense>
  );
}

export const Route = createFileRoute("/_app/procurement/goods-receipt/create/")(
  {
    head: () => ({ meta: [{ title: withSiteName("Catat Goods Receipt") }] }),
    component: Page,
  },
);
