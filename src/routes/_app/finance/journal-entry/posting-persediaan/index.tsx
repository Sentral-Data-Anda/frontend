import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { withSiteName } from "@/config/site";
import { PostingPersediaanScreen } from "@/features/keuangan/jurnal/posting";

function Page() {
  return (
    <Suspense fallback={<LoadingGlobal />}>
      <PostingPersediaanScreen />
    </Suspense>
  );
}

export const Route = createFileRoute(
  "/_app/finance/journal-entry/posting-persediaan/",
)({
  head: () => ({
    meta: [{ title: withSiteName("Posting Mutasi Persediaan") }],
  }),
  component: Page,
});
