import { createFileRoute } from "@tanstack/react-router";

import { withSiteName } from "@/config/site";
import { SatuanFormScreen } from "@/features/inventaris/satuan/form";

function Page() {
  const { publicId } = Route.useParams();

  return <SatuanFormScreen code={publicId} />;
}

export const Route = createFileRoute("/_app/inventory/satuan/edit/$publicId/")({
  head: () => ({ meta: [{ title: withSiteName("Ubah Satuan") }] }),
  component: Page,
});
