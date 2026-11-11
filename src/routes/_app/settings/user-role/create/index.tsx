import { createFileRoute } from "@tanstack/react-router";

import { withSiteName } from "@/config/site";
import { RoleUserFormScreen } from "@/features/pengaturan/role-user/form";

function Page() {
  return <RoleUserFormScreen />;
}

export const Route = createFileRoute("/_app/settings/user-role/create/")({
  head: () => ({ meta: [{ title: withSiteName("Tambah Role") }] }),
  component: Page,
});
