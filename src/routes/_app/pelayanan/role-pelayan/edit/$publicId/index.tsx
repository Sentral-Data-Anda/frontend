import { createFileRoute } from "@tanstack/react-router";

import { withSiteName } from "@/config/site";
import { RolePelayanFormScreen } from "@/features/pelayanan/role-pelayan/form";

function Page() {
  const { publicId } = Route.useParams();

  return <RolePelayanFormScreen id={publicId} />;
}

export const Route = createFileRoute(
  "/_app/pelayanan/role-pelayan/edit/$publicId/",
)({
  head: () => ({ meta: [{ title: withSiteName("Ubah Role Pelayan") }] }),
  component: Page,
});
