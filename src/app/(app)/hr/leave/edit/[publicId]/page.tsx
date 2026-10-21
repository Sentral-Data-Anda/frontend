import type { Metadata } from "next";

import { CutiFormScreen } from "@/features/sdm/cuti/form";

export const metadata: Metadata = {
  title: "Ubah Pengajuan Cuti",
};

export default async function Page({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;

  return <CutiFormScreen code={publicId} />;
}
