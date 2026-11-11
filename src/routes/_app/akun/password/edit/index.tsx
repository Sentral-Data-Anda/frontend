import { createFileRoute } from "@tanstack/react-router";

import { withSiteName } from "@/config/site";
import { PasswordFormScreen } from "@/features/akun/password";

function Page() {
  return <PasswordFormScreen />;
}

export const Route = createFileRoute("/_app/akun/password/edit/")({
  head: () => ({ meta: [{ title: withSiteName("Ubah password") }] }),
  component: Page,
});
