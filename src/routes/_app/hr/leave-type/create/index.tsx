import { createFileRoute } from "@tanstack/react-router";

import { withSiteName } from "@/config/site";
import { TipeCutiFormScreen } from "@/features/sdm/tipe-cuti/form";

function Page() {
  return <TipeCutiFormScreen />;
}

export const Route = createFileRoute("/_app/hr/leave-type/create/")({
  head: () => ({ meta: [{ title: withSiteName("Tambah Leave Type") }] }),
  component: Page,
});
