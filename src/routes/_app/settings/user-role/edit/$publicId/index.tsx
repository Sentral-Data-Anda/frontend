import { createFileRoute } from "@tanstack/react-router";

import { withSiteName } from "@/config/site";
import { RoleUserFormScreen } from "@/features/pengaturan/role-user/form";

function Page() {
  const { publicId } = Route.useParams();

  return <RoleUserFormScreen id={publicId} />;
}

export const Route = createFileRoute(
  "/_app/settings/user-role/edit/$publicId/",
)({
  head: () => ({ meta: [{ title: withSiteName("Ubah Role") }] }),
  component: Page,
});
