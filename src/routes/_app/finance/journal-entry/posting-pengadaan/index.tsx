import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { withSiteName } from "@/config/site";
import { PostingPengadaanScreen } from "@/features/keuangan/jurnal/posting";

function Page() {
  return (
    <Suspense fallback={<LoadingGlobal />}>
      <PostingPengadaanScreen />
    </Suspense>
  );
}

export const Route = createFileRoute(
  "/_app/finance/journal-entry/posting-pengadaan/",
)({
  head: () => ({ meta: [{ title: withSiteName("Posting Pengadaan") }] }),
  component: Page,
});
