import { createFileRoute } from "@tanstack/react-router";

import { withSiteName } from "@/config/site";
import { PenyusutanFormScreen } from "@/features/inventaris/penyusutan/form";

function Page() {
  return <PenyusutanFormScreen />;
}

export const Route = createFileRoute("/_app/fixed-asset/depreciation/create/")({
  head: () => ({ meta: [{ title: withSiteName("Buka Periode Penyusutan") }] }),
  component: Page,
});
