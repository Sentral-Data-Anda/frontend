import type { Metadata } from "next";

import { TipeCutiFormScreen } from "@/features/sdm/tipe-cuti/form";

export const metadata: Metadata = {
  title: "Ubah Tipe Cuti",
};

export default async function Page({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  return <TipeCutiFormScreen code={code} />;
}
