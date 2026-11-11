import { createFileRoute } from "@tanstack/react-router";

import { withSiteName } from "@/config/site";
import { EventFormScreen } from "@/features/kegiatan/event/form";

function Page() {
  const { publicId } = Route.useParams();

  return <EventFormScreen code={publicId} />;
}

export const Route = createFileRoute("/_app/kegiatan/event/edit/$publicId/")({
  head: () => ({ meta: [{ title: withSiteName("Ubah Event") }] }),
  component: Page,
});
