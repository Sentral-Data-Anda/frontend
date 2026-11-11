import { createFileRoute } from "@tanstack/react-router";

import { withSiteName } from "@/config/site";
import { WilayahFormScreen } from "@/features/kejemaatan/wilayah/form";

function Page() {
  const { publicId } = Route.useParams();

  return <WilayahFormScreen code={publicId} />;
}

export const Route = createFileRoute(
  "/_app/kejemaatan/wilayah/edit/$publicId/",
)({
  head: () => ({ meta: [{ title: withSiteName("Ubah Wilayah") }] }),
  component: Page,
});
