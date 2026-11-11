import { createFileRoute } from "@tanstack/react-router";

import { withSiteName } from "@/config/site";
import { AccountFormScreen } from "@/features/keuangan/akun/form";

function Page() {
  const { publicId } = Route.useParams();

  return <AccountFormScreen code={publicId} />;
}

export const Route = createFileRoute(
  "/_app/finance/chart-of-account/edit/$publicId/",
)({
  head: () => ({ meta: [{ title: withSiteName("Ubah Chart of Account") }] }),
  component: Page,
});
