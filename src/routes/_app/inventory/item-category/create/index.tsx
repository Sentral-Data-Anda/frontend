import { createFileRoute } from "@tanstack/react-router";

import { withSiteName } from "@/config/site";
import { TipeBarangFormScreen } from "@/features/inventaris/tipe-barang/form";

function Page() {
  return <TipeBarangFormScreen />;
}

export const Route = createFileRoute("/_app/inventory/item-category/create/")({
  head: () => ({ meta: [{ title: withSiteName("Tambah Item Category") }] }),
  component: Page,
});
