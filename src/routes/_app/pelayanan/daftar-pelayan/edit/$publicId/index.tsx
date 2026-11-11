import { createFileRoute } from "@tanstack/react-router";

import { withSiteName } from "@/config/site";
import { DaftarPelayanFormScreen } from "@/features/pelayanan/daftar-pelayan/form";

function Page() {
  const { publicId } = Route.useParams();

  return <DaftarPelayanFormScreen publicId={publicId} />;
}

export const Route = createFileRoute(
  "/_app/pelayanan/daftar-pelayan/edit/$publicId/",
)({
  head: () => ({ meta: [{ title: withSiteName("Ubah Pelayan") }] }),
  component: Page,
});
