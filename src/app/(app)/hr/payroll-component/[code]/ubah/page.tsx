import type { Metadata } from "next";

import { KatalogFormScreen } from "@/features/sdm/komponen-payroll/form";

export const metadata: Metadata = {
  title: "Ubah Komponen Payroll",
};

export default async function Page({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  return <KatalogFormScreen code={code} />;
}
