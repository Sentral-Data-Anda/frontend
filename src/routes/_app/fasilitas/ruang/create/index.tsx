import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { withSiteName } from "@/config/site";
import { RuangFormScreen } from "@/features/fasilitas/ruang/form";

function Page() {
  return (
    <Suspense fallback={<LoadingGlobal />}>
      <RuangFormScreen />
    </Suspense>
  );
}

export const Route = createFileRoute("/_app/fasilitas/ruang/create/")({
  head: () => ({ meta: [{ title: withSiteName("Tambah Ruang") }] }),
  component: Page,
});
