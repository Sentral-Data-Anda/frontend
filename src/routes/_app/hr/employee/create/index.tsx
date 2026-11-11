import { createFileRoute } from "@tanstack/react-router";

import { withSiteName } from "@/config/site";
import { KaryawanFormScreen } from "@/features/sdm/karyawan/form";

function Page() {
  return <KaryawanFormScreen />;
}

export const Route = createFileRoute("/_app/hr/employee/create/")({
  head: () => ({ meta: [{ title: withSiteName("Tambah Employee") }] }),
  component: Page,
});
