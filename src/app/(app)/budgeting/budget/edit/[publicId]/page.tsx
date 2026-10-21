import type { Metadata } from "next";

import { AllocationFormScreen } from "@/features/anggaran/pagu-anggaran/form";

export const metadata: Metadata = {
  title: "Ubah Budget",
};

export default async function Page({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;

  return <AllocationFormScreen publicId={publicId} />;
}
