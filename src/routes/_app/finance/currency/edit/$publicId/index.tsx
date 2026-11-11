import { createFileRoute } from "@tanstack/react-router";

import { withSiteName } from "@/config/site";
import { CurrencyFormScreen } from "@/features/keuangan/mata-uang/form";

function Page() {
  const { publicId } = Route.useParams();

  return <CurrencyFormScreen code={publicId} />;
}

export const Route = createFileRoute("/_app/finance/currency/edit/$publicId/")({
  head: () => ({ meta: [{ title: withSiteName("Ubah Currency") }] }),
  component: Page,
});
