import { createFileRoute } from "@tanstack/react-router";

import { withSiteName } from "@/config/site";
import { BarangFormScreen } from "@/features/inventaris/barang/form";

function Page() {
  const { publicId } = Route.useParams();

  return <BarangFormScreen code={publicId} />;
}

export const Route = createFileRoute(
  "/_app/fixed-asset/asset-master/edit/$publicId/",
)({
  head: () => ({ meta: [{ title: withSiteName("Ubah Asset Master") }] }),
  component: Page,
});
