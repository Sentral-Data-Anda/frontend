import { createFileRoute } from "@tanstack/react-router";

import { withSiteName } from "@/config/site";
import { JemaatFormScreen } from "@/features/kejemaatan/daftar-jemaat/form";

function Page() {
  const { publicId } = Route.useParams();

  return <JemaatFormScreen code={publicId} />;
}

export const Route = createFileRoute(
  "/_app/kejemaatan/daftar-jemaat/edit/$publicId/",
)({
  head: () => ({ meta: [{ title: withSiteName("Ubah Jemaat") }] }),
  component: Page,
});
