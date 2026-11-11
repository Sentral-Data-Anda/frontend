import { createFileRoute } from "@tanstack/react-router";

import { withSiteName } from "@/config/site";
import { RateFormScreen } from "@/features/keuangan/mata-uang/form";

function Page() {
  const { code } = Route.useParams();

  return <RateFormScreen code={code} />;
}

export const Route = createFileRoute(
  "/_app/finance/currency/$code/kurs/create/",
)({
  head: () => ({ meta: [{ title: withSiteName("Tambah Kurs") }] }),
  component: Page,
});
