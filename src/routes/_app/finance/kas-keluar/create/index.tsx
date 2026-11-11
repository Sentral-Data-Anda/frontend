import { createFileRoute } from "@tanstack/react-router";

import { withSiteName } from "@/config/site";
import { ExpenseFormScreen } from "@/features/keuangan/kas-keluar/form";

function Page() {
  return <ExpenseFormScreen />;
}

export const Route = createFileRoute("/_app/finance/kas-keluar/create/")({
  head: () => ({ meta: [{ title: withSiteName("Tambah Kas Keluar") }] }),
  component: Page,
});
