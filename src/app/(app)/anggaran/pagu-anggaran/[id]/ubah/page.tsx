import type { Metadata } from "next";

import { AllocationFormScreen } from "@/features/anggaran/pagu-anggaran/form";

export const metadata: Metadata = {
  title: "Ubah Pagu Anggaran",
};

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <AllocationFormScreen publicId={id} />;
}
