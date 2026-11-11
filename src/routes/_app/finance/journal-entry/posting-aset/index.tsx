import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { withSiteName } from "@/config/site";
import { PostingAsetScreen } from "@/features/keuangan/jurnal/posting";

function Page() {
  return (
    <Suspense fallback={<LoadingGlobal />}>
      <PostingAsetScreen />
    </Suspense>
  );
}

export const Route = createFileRoute(
  "/_app/finance/journal-entry/posting-aset/",
)({
  head: () => ({ meta: [{ title: withSiteName("Posting Aset Sumbangan") }] }),
  component: Page,
});
