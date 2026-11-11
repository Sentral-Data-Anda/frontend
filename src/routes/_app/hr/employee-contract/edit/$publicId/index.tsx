import { createFileRoute } from "@tanstack/react-router";

import { withSiteName } from "@/config/site";
import { KontrakFormScreen } from "@/features/sdm/kontrak-karyawan/form";

function Page() {
  const { publicId } = Route.useParams();

  return <KontrakFormScreen code={publicId} />;
}

export const Route = createFileRoute(
  "/_app/hr/employee-contract/edit/$publicId/",
)({
  head: () => ({ meta: [{ title: withSiteName("Ubah Employee Contract") }] }),
  component: Page,
});
