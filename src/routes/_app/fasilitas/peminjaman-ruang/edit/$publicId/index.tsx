import { createFileRoute } from "@tanstack/react-router";

import { withSiteName } from "@/config/site";
import { LoanFormScreen } from "@/features/fasilitas/peminjaman-ruang/form";

function Page() {
  const { publicId } = Route.useParams();

  return <LoanFormScreen code={publicId} />;
}

export const Route = createFileRoute(
  "/_app/fasilitas/peminjaman-ruang/edit/$publicId/",
)({
  head: () => ({ meta: [{ title: withSiteName("Ubah Peminjaman") }] }),
  component: Page,
});
