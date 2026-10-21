import type { Metadata } from "next";

import { TipeCutiFormScreen } from "@/features/sdm/tipe-cuti/form";

export const metadata: Metadata = {
  title: "Ubah Leave Type",
};

export default async function Page({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;

  return <TipeCutiFormScreen code={publicId} />;
}
