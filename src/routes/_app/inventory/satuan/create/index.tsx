import { createFileRoute } from "@tanstack/react-router";

import { withSiteName } from "@/config/site";
import { SatuanFormScreen } from "@/features/inventaris/satuan/form";

function Page() {
  return <SatuanFormScreen />;
}

export const Route = createFileRoute("/_app/inventory/satuan/create/")({
  head: () => ({ meta: [{ title: withSiteName("Tambah Satuan") }] }),
  component: Page,
});
