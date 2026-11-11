import { createFileRoute } from "@tanstack/react-router";

import { withSiteName } from "@/config/site";
import { KeluargaFormScreen } from "@/features/kejemaatan/keluarga/form";

function Page() {
  const { publicId } = Route.useParams();

  return <KeluargaFormScreen code={publicId} />;
}

export const Route = createFileRoute(
  "/_app/kejemaatan/keluarga/edit/$publicId/",
)({
  head: () => ({ meta: [{ title: withSiteName("Ubah Keluarga") }] }),
  component: Page,
});
