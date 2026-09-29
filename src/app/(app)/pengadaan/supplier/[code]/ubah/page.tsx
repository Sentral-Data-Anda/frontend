import type { Metadata } from "next";

import { SupplierFormScreen } from "@/features/pengadaan/supplier/form";

export const metadata: Metadata = {
  title: "Ubah Supplier",
};

export default async function Page({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  return <SupplierFormScreen code={code} />;
}
