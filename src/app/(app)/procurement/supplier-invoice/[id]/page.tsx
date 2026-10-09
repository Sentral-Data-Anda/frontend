import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { InvoiceDetailScreen } from "@/features/pengadaan/faktur-supplier/detail";

export const metadata: Metadata = { title: "Faktur Supplier" };

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;

  return (
    <Suspense fallback={<LoadingGlobal />}>
      <InvoiceDetailScreen publicId={decodeURIComponent(id)} />
    </Suspense>
  );
}
