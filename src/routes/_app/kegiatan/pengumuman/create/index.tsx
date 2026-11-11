import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { withSiteName } from "@/config/site";
import { PengumumanFormScreen } from "@/features/kegiatan/pengumuman/form";

function Page() {
  return (
    <Suspense fallback={<LoadingGlobal />}>
      <PengumumanFormScreen />
    </Suspense>
  );
}

export const Route = createFileRoute("/_app/kegiatan/pengumuman/create/")({
  head: () => ({ meta: [{ title: withSiteName("Buat Pengumuman") }] }),
  component: Page,
});
