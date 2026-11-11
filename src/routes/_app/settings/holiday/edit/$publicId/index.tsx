import { createFileRoute } from "@tanstack/react-router";

import { withSiteName } from "@/config/site";
import { HolidayFormScreen } from "@/features/pengaturan/hari-libur/form";

function Page() {
  const { publicId } = Route.useParams();

  return <HolidayFormScreen id={publicId} />;
}

export const Route = createFileRoute("/_app/settings/holiday/edit/$publicId/")({
  head: () => ({ meta: [{ title: withSiteName("Ubah Holiday") }] }),
  component: Page,
});
