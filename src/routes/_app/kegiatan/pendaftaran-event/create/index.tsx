import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { withSiteName } from "@/config/site";
import { PendaftaranFormScreen } from "@/features/kegiatan/pendaftaran-event/form";

function Page() {
  return (
    <Suspense fallback={<LoadingGlobal />}>
      <PendaftaranFormScreen />
    </Suspense>
  );
}

export const Route = createFileRoute(
  "/_app/kegiatan/pendaftaran-event/create/",
)({
  head: () => ({ meta: [{ title: withSiteName("Daftarkan Peserta") }] }),
  component: Page,
});
