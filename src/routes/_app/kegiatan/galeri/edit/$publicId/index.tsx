import { createFileRoute } from "@tanstack/react-router";

import { withSiteName } from "@/config/site";
import { GaleriFormScreen } from "@/features/kegiatan/galeri/form";

function Page() {
  const { publicId } = Route.useParams();

  return <GaleriFormScreen code={publicId} />;
}

export const Route = createFileRoute("/_app/kegiatan/galeri/edit/$publicId/")({
  head: () => ({ meta: [{ title: withSiteName("Ubah Album") }] }),
  component: Page,
});
