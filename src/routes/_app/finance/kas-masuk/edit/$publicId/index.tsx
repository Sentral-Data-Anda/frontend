import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { withSiteName } from "@/config/site";
import { ReceiptFormScreen } from "@/features/keuangan/kas-masuk/form";

function Page() {
  const { publicId } = Route.useParams();

  return (
    <Suspense fallback={<LoadingGlobal />}>
      <ReceiptFormScreen publicId={publicId} />
    </Suspense>
  );
}

export const Route = createFileRoute("/_app/finance/kas-masuk/edit/$publicId/")(
  {
    head: () => ({ meta: [{ title: withSiteName("Ubah Kas Masuk") }] }),
    component: Page,
  },
);
