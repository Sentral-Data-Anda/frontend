import { createFileRoute } from "@tanstack/react-router";

import { withSiteName } from "@/config/site";
import { RolePelayanFormScreen } from "@/features/pelayanan/role-pelayan/form";

function Page() {
  return <RolePelayanFormScreen />;
}

export const Route = createFileRoute("/_app/pelayanan/role-pelayan/create/")({
  head: () => ({ meta: [{ title: withSiteName("Tambah Role Pelayan") }] }),
  component: Page,
});
