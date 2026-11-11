import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { withSiteName } from "@/config/site";
import { JournalFormScreen } from "@/features/keuangan/jurnal/form";

function Page() {
  return (
    <Suspense fallback={<LoadingGlobal />}>
      <JournalFormScreen />
    </Suspense>
  );
}

export const Route = createFileRoute("/_app/finance/journal-entry/create/")({
  head: () => ({ meta: [{ title: withSiteName("Tambah Journal Entry") }] }),
  component: Page,
});
