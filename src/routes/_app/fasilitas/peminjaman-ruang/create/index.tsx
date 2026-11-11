import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { withSiteName } from "@/config/site";
import { LoanFormScreen } from "@/features/fasilitas/peminjaman-ruang/form";

function Page() {
  return (
    <Suspense fallback={<LoadingGlobal />}>
      <LoanFormScreen />
    </Suspense>
  );
}

export const Route = createFileRoute(
  "/_app/fasilitas/peminjaman-ruang/create/",
)({
  head: () => ({ meta: [{ title: withSiteName("Tambah Peminjaman") }] }),
  component: Page,
});
