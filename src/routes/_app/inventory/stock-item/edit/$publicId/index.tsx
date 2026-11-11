import { createFileRoute } from "@tanstack/react-router";

import { withSiteName } from "@/config/site";
import { StockFormScreen } from "@/features/inventaris/barang-persediaan/form";

function Page() {
  const { publicId } = Route.useParams();

  return <StockFormScreen code={publicId} />;
}

export const Route = createFileRoute(
  "/_app/inventory/stock-item/edit/$publicId/",
)({
  head: () => ({ meta: [{ title: withSiteName("Ubah Stock Item") }] }),
  component: Page,
});
