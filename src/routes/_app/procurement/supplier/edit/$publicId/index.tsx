import { createFileRoute } from "@tanstack/react-router";

import { withSiteName } from "@/config/site";
import { SupplierFormScreen } from "@/features/pengadaan/supplier/form";

function Page() {
  const { publicId } = Route.useParams();

  return <SupplierFormScreen code={publicId} />;
}

export const Route = createFileRoute(
  "/_app/procurement/supplier/edit/$publicId/",
)({
  head: () => ({ meta: [{ title: withSiteName("Ubah Supplier") }] }),
  component: Page,
});
