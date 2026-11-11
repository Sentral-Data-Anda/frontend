import { createFileRoute } from "@tanstack/react-router";

import { withSiteName } from "@/config/site";
import { KaryawanFormScreen } from "@/features/sdm/karyawan/form";

function Page() {
  const { publicId } = Route.useParams();

  return <KaryawanFormScreen code={publicId} />;
}

export const Route = createFileRoute("/_app/hr/employee/edit/$publicId/")({
  head: () => ({ meta: [{ title: withSiteName("Ubah Employee") }] }),
  component: Page,
});
