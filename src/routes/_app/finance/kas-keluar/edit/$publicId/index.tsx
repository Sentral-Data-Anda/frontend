import { createFileRoute } from "@tanstack/react-router";

import { withSiteName } from "@/config/site";
import { ExpenseFormScreen } from "@/features/keuangan/kas-keluar/form";

function Page() {
  const { publicId } = Route.useParams();

  return <ExpenseFormScreen publicId={publicId} />;
}

export const Route = createFileRoute(
  "/_app/finance/kas-keluar/edit/$publicId/",
)({
  head: () => ({ meta: [{ title: withSiteName("Ubah Kas Keluar") }] }),
  component: Page,
});
