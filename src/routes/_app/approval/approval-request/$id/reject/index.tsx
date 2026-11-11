import { createFileRoute } from "@tanstack/react-router";

import { withSiteName } from "@/config/site";
import { PermintaanRejectScreen } from "@/features/persetujuan/permintaan-persetujuan/form";

function Page() {
  const { id } = Route.useParams();

  return <PermintaanRejectScreen id={id} />;
}

export const Route = createFileRoute(
  "/_app/approval/approval-request/$id/reject/",
)({
  head: () => ({ meta: [{ title: withSiteName("Tolak Approval Request") }] }),
  component: Page,
});
