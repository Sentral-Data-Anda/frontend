import { createFileRoute } from "@tanstack/react-router";

import { withSiteName } from "@/config/site";
import { AccountFormScreen } from "@/features/keuangan/akun/form";

function Page() {
  return <AccountFormScreen />;
}

export const Route = createFileRoute("/_app/finance/chart-of-account/create/")({
  head: () => ({ meta: [{ title: withSiteName("Tambah Chart of Account") }] }),
  component: Page,
});
