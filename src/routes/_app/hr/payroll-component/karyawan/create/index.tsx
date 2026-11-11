import { createFileRoute } from "@tanstack/react-router";

import { withSiteName } from "@/config/site";
import { PenetapanFormScreen } from "@/features/sdm/komponen-payroll/form";

function Page() {
  return <PenetapanFormScreen />;
}

export const Route = createFileRoute(
  "/_app/hr/payroll-component/karyawan/create/",
)({
  head: () => ({
    meta: [{ title: withSiteName("Tambah Penetapan Komponen") }],
  }),
  component: Page,
});
