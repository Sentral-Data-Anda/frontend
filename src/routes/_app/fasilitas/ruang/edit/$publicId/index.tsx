import { createFileRoute } from "@tanstack/react-router";

import { withSiteName } from "@/config/site";
import { RuangFormScreen } from "@/features/fasilitas/ruang/form";

function Page() {
  const { publicId } = Route.useParams();

  return <RuangFormScreen code={publicId} />;
}

export const Route = createFileRoute("/_app/fasilitas/ruang/edit/$publicId/")({
  head: () => ({ meta: [{ title: withSiteName("Ubah Ruang") }] }),
  component: Page,
});
