import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { withSiteName } from "@/config/site";
import { JadwalPelayanFormScreen } from "@/features/pelayanan/jadwal-pelayan/form";

function Page() {
  return (
    <Suspense fallback={<LoadingGlobal />}>
      <JadwalPelayanFormScreen />
    </Suspense>
  );
}

export const Route = createFileRoute("/_app/pelayanan/jadwal-pelayan/create/")({
  head: () => ({ meta: [{ title: withSiteName("Tambah Jadwal Pelayan") }] }),
  component: Page,
});
