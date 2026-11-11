import { createFileRoute } from "@tanstack/react-router";

import { withSiteName } from "@/config/site";
import { RoleJemaatFormScreen } from "@/features/kejemaatan/role-jemaat/form";

function Page() {
  return <RoleJemaatFormScreen />;
}

export const Route = createFileRoute("/_app/kejemaatan/role-jemaat/create/")({
  head: () => ({ meta: [{ title: withSiteName("Tambah Jabatan") }] }),
  component: Page,
});
