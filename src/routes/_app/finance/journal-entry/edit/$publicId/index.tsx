import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { withSiteName } from "@/config/site";
import { JournalFormScreen } from "@/features/keuangan/jurnal/form";

function Page() {
  const { publicId } = Route.useParams();

  return (
    <Suspense fallback={<LoadingGlobal />}>
      <JournalFormScreen publicId={publicId} />
    </Suspense>
  );
}

export const Route = createFileRoute(
  "/_app/finance/journal-entry/edit/$publicId/",
)({
  head: () => ({ meta: [{ title: withSiteName("Ubah Journal Entry") }] }),
  component: Page,
});
