import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { withSiteName } from "@/config/site";
import { GaleriFormScreen } from "@/features/kegiatan/galeri/form";

function Page() {
  return (
    <Suspense fallback={<LoadingGlobal />}>
      <GaleriFormScreen />
    </Suspense>
  );
}

export const Route = createFileRoute("/_app/kegiatan/galeri/create/")({
  head: () => ({ meta: [{ title: withSiteName("Tambah Album") }] }),
  component: Page,
});
