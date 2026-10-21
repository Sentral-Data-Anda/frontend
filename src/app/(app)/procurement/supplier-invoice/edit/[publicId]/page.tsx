import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { InvoiceFormScreen } from "@/features/pengadaan/faktur-supplier/form";

export const metadata: Metadata = { title: "Ubah Supplier Invoice" };

export default async function Page(props: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await props.params;

  return (
    <Suspense fallback={<LoadingGlobal />}>
      <InvoiceFormScreen publicId={decodeURIComponent(publicId)} />
    </Suspense>
  );
}
