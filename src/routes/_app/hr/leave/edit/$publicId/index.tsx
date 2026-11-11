import { createFileRoute } from "@tanstack/react-router";

import { withSiteName } from "@/config/site";
import { CutiFormScreen } from "@/features/sdm/cuti/form";

function Page() {
  const { publicId } = Route.useParams();

  return <CutiFormScreen code={publicId} />;
}

export const Route = createFileRoute("/_app/hr/leave/edit/$publicId/")({
  head: () => ({ meta: [{ title: withSiteName("Ubah Pengajuan Cuti") }] }),
  component: Page,
});
