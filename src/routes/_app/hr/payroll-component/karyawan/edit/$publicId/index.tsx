import { createFileRoute } from "@tanstack/react-router";

import { withSiteName } from "@/config/site";
import { PenetapanFormScreen } from "@/features/sdm/komponen-payroll/form";

function Page() {
  const { publicId } = Route.useParams();

  return <PenetapanFormScreen publicId={publicId} />;
}

export const Route = createFileRoute(
  "/_app/hr/payroll-component/karyawan/edit/$publicId/",
)({
  head: () => ({ meta: [{ title: withSiteName("Ubah Penetapan Komponen") }] }),
  component: Page,
});
