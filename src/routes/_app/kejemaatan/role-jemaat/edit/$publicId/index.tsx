import { createFileRoute } from "@tanstack/react-router";

import { withSiteName } from "@/config/site";
import { RoleJemaatFormScreen } from "@/features/kejemaatan/role-jemaat/form";

function Page() {
  const { publicId } = Route.useParams();

  return <RoleJemaatFormScreen id={publicId} />;
}

export const Route = createFileRoute(
  "/_app/kejemaatan/role-jemaat/edit/$publicId/",
)({
  head: () => ({ meta: [{ title: withSiteName("Ubah Jabatan") }] }),
  component: Page,
});
