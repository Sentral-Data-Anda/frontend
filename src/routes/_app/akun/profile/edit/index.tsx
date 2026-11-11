import { createFileRoute } from "@tanstack/react-router";

import { withSiteName } from "@/config/site";
import { ProfileFormScreen } from "@/features/akun/profile";

function Page() {
  return <ProfileFormScreen />;
}

export const Route = createFileRoute("/_app/akun/profile/edit/")({
  head: () => ({ meta: [{ title: withSiteName("Ubah data pribadi") }] }),
  component: Page,
});
