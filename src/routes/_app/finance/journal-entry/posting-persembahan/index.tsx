import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { withSiteName } from "@/config/site";
import { PostingPersembahanScreen } from "@/features/keuangan/jurnal/posting";

function Page() {
  return (
    <Suspense fallback={<LoadingGlobal />}>
      <PostingPersembahanScreen />
    </Suspense>
  );
}

export const Route = createFileRoute(
  "/_app/finance/journal-entry/posting-persembahan/",
)({
  head: () => ({ meta: [{ title: withSiteName("Posting Persembahan") }] }),
  component: Page,
});
