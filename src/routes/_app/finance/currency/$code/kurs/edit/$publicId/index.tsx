import { createFileRoute } from "@tanstack/react-router";

import { withSiteName } from "@/config/site";
import { RateFormScreen } from "@/features/keuangan/mata-uang/form";

function Page() {
  const { code, publicId } = Route.useParams();

  return <RateFormScreen code={code} id={publicId} />;
}

export const Route = createFileRoute(
  "/_app/finance/currency/$code/kurs/edit/$publicId/",
)({
  head: () => ({ meta: [{ title: withSiteName("Ubah Kurs") }] }),
  component: Page,
});
