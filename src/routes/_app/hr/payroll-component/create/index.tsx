import { createFileRoute } from "@tanstack/react-router";

import { withSiteName } from "@/config/site";
import { KatalogFormScreen } from "@/features/sdm/komponen-payroll/form";

function Page() {
  return <KatalogFormScreen />;
}

export const Route = createFileRoute("/_app/hr/payroll-component/create/")({
  head: () => ({ meta: [{ title: withSiteName("Tambah Payroll Component") }] }),
  component: Page,
});
