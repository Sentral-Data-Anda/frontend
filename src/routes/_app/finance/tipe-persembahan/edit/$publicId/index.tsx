import { createFileRoute } from "@tanstack/react-router";

import { withSiteName } from "@/config/site";
import { OfferingTypeFormScreen } from "@/features/keuangan/tipe-persembahan/form";

function Page() {
  const { publicId } = Route.useParams();

  return <OfferingTypeFormScreen code={publicId} />;
}

export const Route = createFileRoute(
  "/_app/finance/tipe-persembahan/edit/$publicId/",
)({
  head: () => ({ meta: [{ title: withSiteName("Ubah Tipe Persembahan") }] }),
  component: Page,
});
