import { createFileRoute } from "@tanstack/react-router";

import { withSiteName } from "@/config/site";
import { AccountScreen } from "@/features/akun/overview";

function Page() {
  return <AccountScreen />;
}

export const Route = createFileRoute("/_app/akun/")({
  head: () => ({ meta: [{ title: withSiteName("Akun saya") }] }),
  component: Page,
});
