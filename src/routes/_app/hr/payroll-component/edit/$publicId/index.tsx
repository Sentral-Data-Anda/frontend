import { createFileRoute } from "@tanstack/react-router";

import { withSiteName } from "@/config/site";
import { KatalogFormScreen } from "@/features/sdm/komponen-payroll/form";

function Page() {
  const { publicId } = Route.useParams();

  return <KatalogFormScreen code={publicId} />;
}

export const Route = createFileRoute(
  "/_app/hr/payroll-component/edit/$publicId/",
)({
  head: () => ({ meta: [{ title: withSiteName("Ubah Payroll Component") }] }),
  component: Page,
});
