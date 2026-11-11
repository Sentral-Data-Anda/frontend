import { createFileRoute } from "@tanstack/react-router";

import { withSiteName } from "@/config/site";
import { TipeCutiFormScreen } from "@/features/sdm/tipe-cuti/form";

function Page() {
  const { publicId } = Route.useParams();

  return <TipeCutiFormScreen code={publicId} />;
}

export const Route = createFileRoute("/_app/hr/leave-type/edit/$publicId/")({
  head: () => ({ meta: [{ title: withSiteName("Ubah Leave Type") }] }),
  component: Page,
});
