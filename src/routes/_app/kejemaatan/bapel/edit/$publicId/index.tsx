import { createFileRoute } from "@tanstack/react-router";

import { withSiteName } from "@/config/site";
import { BapelFormScreen } from "@/features/kejemaatan/bapel/form";

function Page() {
  const { publicId } = Route.useParams();

  return <BapelFormScreen code={publicId} />;
}

export const Route = createFileRoute("/_app/kejemaatan/bapel/edit/$publicId/")({
  head: () => ({ meta: [{ title: withSiteName("Ubah Badan Pelayanan") }] }),
  component: Page,
});
