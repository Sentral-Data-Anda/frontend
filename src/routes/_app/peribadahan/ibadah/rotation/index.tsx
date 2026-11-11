import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { withSiteName } from "@/config/site";
import { GiliranScreen } from "@/features/peribadahan/ibadah/form";

function Page() {
  return (
    <Suspense fallback={<LoadingGlobal />}>
      <GiliranScreen />
    </Suspense>
  );
}

export const Route = createFileRoute("/_app/peribadahan/ibadah/rotation/")({
  head: () => ({
    meta: [{ title: withSiteName("Jadwal Giliran Tuan Rumah") }],
  }),
  component: Page,
});
