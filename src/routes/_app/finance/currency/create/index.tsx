import { createFileRoute } from "@tanstack/react-router";

import { withSiteName } from "@/config/site";
import { CurrencyFormScreen } from "@/features/keuangan/mata-uang/form";

function Page() {
  return <CurrencyFormScreen />;
}

export const Route = createFileRoute("/_app/finance/currency/create/")({
  head: () => ({ meta: [{ title: withSiteName("Tambah Currency") }] }),
  component: Page,
});
