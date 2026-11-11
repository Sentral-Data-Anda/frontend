import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { withSiteName } from "@/config/site";
import { BarangLabelScreen } from "@/features/inventaris/barang/label";
import { env } from "@/lib/env";

function Page() {
  return (
    <Suspense fallback={<LoadingGlobal />}>
      <BarangLabelScreen siteUrl={env.VITE_SITE_URL} />
    </Suspense>
  );
}

export const Route = createFileRoute("/_app/fixed-asset/asset-master/label/")({
  head: () => ({ meta: [{ title: withSiteName("Cetak Label Barang") }] }),
  component: Page,
});
