import { createFileRoute } from "@tanstack/react-router";

import { withSiteName } from "@/config/site";
import { OfferingTypeFormScreen } from "@/features/keuangan/tipe-persembahan/form";

function Page() {
  return <OfferingTypeFormScreen />;
}

export const Route = createFileRoute("/_app/finance/tipe-persembahan/create/")({
  head: () => ({ meta: [{ title: withSiteName("Tambah Tipe Persembahan") }] }),
  component: Page,
});
