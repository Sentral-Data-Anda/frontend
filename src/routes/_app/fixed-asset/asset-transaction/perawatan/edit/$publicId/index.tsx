import { createFileRoute } from "@tanstack/react-router";

import { withSiteName } from "@/config/site";
import { MaintenanceFormScreen } from "@/features/inventaris/siklus-aset/form";

function Page() {
  const { publicId } = Route.useParams();

  return <MaintenanceFormScreen code={publicId} />;
}

export const Route = createFileRoute(
  "/_app/fixed-asset/asset-transaction/perawatan/edit/$publicId/",
)({
  head: () => ({ meta: [{ title: withSiteName("Ubah Perawatan") }] }),
  component: Page,
});
