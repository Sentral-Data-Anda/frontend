import { createFileRoute } from "@tanstack/react-router";

import { withSiteName } from "@/config/site";
import { KontrakFormScreen } from "@/features/sdm/kontrak-karyawan/form";

function Page() {
  return <KontrakFormScreen />;
}

export const Route = createFileRoute("/_app/hr/employee-contract/create/")({
  head: () => ({ meta: [{ title: withSiteName("Tambah Employee Contract") }] }),
  component: Page,
});
