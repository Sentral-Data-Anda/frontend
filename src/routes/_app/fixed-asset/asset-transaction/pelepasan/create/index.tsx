import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { withSiteName } from "@/config/site";
import { DisposalFormScreen } from "@/features/inventaris/siklus-aset/form";

function Page() {
  return (
    <Suspense fallback={<LoadingGlobal />}>
      <DisposalFormScreen />
    </Suspense>
  );
}

export const Route = createFileRoute(
  "/_app/fixed-asset/asset-transaction/pelepasan/create/",
)({
  head: () => ({ meta: [{ title: withSiteName("Ajukan Pelepasan") }] }),
  component: Page,
});
