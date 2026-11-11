import { createFileRoute } from "@tanstack/react-router";

import { withSiteName } from "@/config/site";
import { PengumumanFormScreen } from "@/features/kegiatan/pengumuman/form";

function Page() {
  const { publicId } = Route.useParams();

  return <PengumumanFormScreen code={publicId} />;
}

export const Route = createFileRoute(
  "/_app/kegiatan/pengumuman/edit/$publicId/",
)({
  head: () => ({ meta: [{ title: withSiteName("Ubah Pengumuman") }] }),
  component: Page,
});
