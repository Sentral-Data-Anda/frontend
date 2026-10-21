import type { Metadata } from "next";

import { KatalogFormScreen } from "@/features/sdm/komponen-payroll/form";

export const metadata: Metadata = {
  title: "Ubah Payroll Component",
};

export default async function Page({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;

  return <KatalogFormScreen code={publicId} />;
}
