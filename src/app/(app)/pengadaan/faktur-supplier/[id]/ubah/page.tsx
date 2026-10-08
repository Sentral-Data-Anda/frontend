import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { InvoiceFormScreen } from "@/features/pengadaan/faktur-supplier/form";

export const metadata: Metadata = { title: "Ubah Faktur Supplier" };

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;

  return (
    <Suspense fallback={<LoadingGlobal />}>
      <InvoiceFormScreen publicId={decodeURIComponent(id)} />
    </Suspense>
  );
}
