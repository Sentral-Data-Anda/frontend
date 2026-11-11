import { createFileRoute } from "@tanstack/react-router";

import { withSiteName } from "@/config/site";
import { IbadahFormScreen } from "@/features/peribadahan/ibadah/form";

function Page() {
  const { publicId } = Route.useParams();

  return <IbadahFormScreen code={publicId} />;
}

export const Route = createFileRoute(
  "/_app/peribadahan/ibadah/edit/$publicId/",
)({
  head: () => ({ meta: [{ title: withSiteName("Ubah Ibadah") }] }),
  component: Page,
});
