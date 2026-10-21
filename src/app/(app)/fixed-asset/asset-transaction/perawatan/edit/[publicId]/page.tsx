import type { Metadata } from "next";

import { MaintenanceFormScreen } from "@/features/inventaris/siklus-aset/form";

export const metadata: Metadata = {
  title: "Ubah Perawatan",
};

export default async function Page({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;

  return <MaintenanceFormScreen code={publicId} />;
}
