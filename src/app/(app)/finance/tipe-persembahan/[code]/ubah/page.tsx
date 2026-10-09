import type { Metadata } from "next";

import { OfferingTypeFormScreen } from "@/features/keuangan/tipe-persembahan/form";

export const metadata: Metadata = {
  title: "Ubah Tipe Persembahan",
};

export default async function Page({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  return <OfferingTypeFormScreen code={code} />;
}
