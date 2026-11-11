import { createFileRoute } from "@tanstack/react-router";

import { withSiteName } from "@/config/site";
import { JadwalPelayanFormScreen } from "@/features/pelayanan/jadwal-pelayan/form";

function Page() {
  const { publicId } = Route.useParams();

  return <JadwalPelayanFormScreen code={publicId} />;
}

export const Route = createFileRoute(
  "/_app/pelayanan/jadwal-pelayan/edit/$publicId/",
)({
  head: () => ({ meta: [{ title: withSiteName("Ubah Jadwal Pelayan") }] }),
  component: Page,
});
