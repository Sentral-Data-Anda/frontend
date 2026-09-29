import type { Metadata } from "next";

import { MaintenanceFormScreen } from "@/features/inventaris/siklus-aset/form";

export const metadata: Metadata = {
  title: "Ubah Perawatan",
};

export default async function Page({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  return <MaintenanceFormScreen code={code} />;
}
