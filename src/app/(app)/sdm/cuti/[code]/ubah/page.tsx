import type { Metadata } from "next";

import { CutiFormScreen } from "@/features/sdm/cuti/form";

export const metadata: Metadata = {
  title: "Ubah Pengajuan Cuti",
};

export default async function Page({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  return <CutiFormScreen code={code} />;
}
