import type { Metadata } from "next";

import { TipeIbadahFormScreen } from "@/features/peribadahan/tipe-ibadah/form";

export const metadata: Metadata = {
  title: "Ubah Tipe Ibadah",
};

export default async function Page({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;

  return <TipeIbadahFormScreen code={publicId} />;
}
