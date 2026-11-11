import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { withSiteName } from "@/config/site";
import { IbadahFormScreen } from "@/features/peribadahan/ibadah/form";

function Page() {
  return (
    <Suspense fallback={<LoadingGlobal />}>
      <IbadahFormScreen />
    </Suspense>
  );
}

export const Route = createFileRoute("/_app/peribadahan/ibadah/create/")({
  head: () => ({ meta: [{ title: withSiteName("Tambah Ibadah") }] }),
  component: Page,
});
