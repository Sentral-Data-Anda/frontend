import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { withSiteName } from "@/config/site";
import { EventFormScreen } from "@/features/kegiatan/event/form";

function Page() {
  return (
    <Suspense fallback={<LoadingGlobal />}>
      <EventFormScreen />
    </Suspense>
  );
}

export const Route = createFileRoute("/_app/kegiatan/event/create/")({
  head: () => ({ meta: [{ title: withSiteName("Tambah Event") }] }),
  component: Page,
});
