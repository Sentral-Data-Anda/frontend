import { createFileRoute } from "@tanstack/react-router";

import { withSiteName } from "@/config/site";
import { TipeBarangFormScreen } from "@/features/inventaris/tipe-barang/form";

function Page() {
  const { publicId } = Route.useParams();

  return <TipeBarangFormScreen code={publicId} />;
}

export const Route = createFileRoute(
  "/_app/inventory/item-category/edit/$publicId/",
)({
  head: () => ({ meta: [{ title: withSiteName("Ubah Item Category") }] }),
  component: Page,
});
