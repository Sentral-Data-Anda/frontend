import { createFileRoute } from "@tanstack/react-router";

import { withSiteName } from "@/config/site";
import { SetelanFormScreen } from "@/features/persetujuan/setelan-persetujuan/form";

function Page() {
  const { publicId } = Route.useParams();

  return <SetelanFormScreen id={publicId} />;
}

export const Route = createFileRoute(
  "/_app/approval/approval-workflow/edit/$publicId/",
)({
  head: () => ({ meta: [{ title: withSiteName("Ubah Alur Persetujuan") }] }),
  component: Page,
});
