import { createFileRoute } from "@tanstack/react-router";

import { withSiteName } from "@/config/site";
import { CutiFormScreen } from "@/features/sdm/cuti/form";

function Page() {
  return <CutiFormScreen />;
}

export const Route = createFileRoute("/_app/hr/leave/create/")({
  head: () => ({ meta: [{ title: withSiteName("Ajukan Cuti") }] }),
  component: Page,
});
