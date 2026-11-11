import { createFileRoute } from "@tanstack/react-router";

import { withSiteName } from "@/config/site";
import { UserFormScreen } from "@/features/pengaturan/user/form";

function Page() {
  return <UserFormScreen />;
}

export const Route = createFileRoute("/_app/settings/user/create/")({
  head: () => ({ meta: [{ title: withSiteName("Tambah Akun") }] }),
  component: Page,
});
