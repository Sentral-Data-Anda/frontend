import { createFileRoute } from "@tanstack/react-router";

import { withSiteName } from "@/config/site";
import { TipeIbadahFormScreen } from "@/features/peribadahan/tipe-ibadah/form";

function Page() {
  const { publicId } = Route.useParams();

  return <TipeIbadahFormScreen code={publicId} />;
}

export const Route = createFileRoute(
  "/_app/peribadahan/tipe-ibadah/edit/$publicId/",
)({
  head: () => ({ meta: [{ title: withSiteName("Ubah Tipe Ibadah") }] }),
  component: Page,
});
