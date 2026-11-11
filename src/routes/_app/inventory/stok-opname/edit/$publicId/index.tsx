import { createFileRoute } from "@tanstack/react-router";

import { withSiteName } from "@/config/site";
import { OpnameFormScreen } from "@/features/inventaris/stok-opname/form";

function Page() {
  const { publicId } = Route.useParams();

  return <OpnameFormScreen code={publicId} />;
}

export const Route = createFileRoute(
  "/_app/inventory/stok-opname/edit/$publicId/",
)({
  head: () => ({ meta: [{ title: withSiteName("Ubah Stok Opname") }] }),
  component: Page,
});
