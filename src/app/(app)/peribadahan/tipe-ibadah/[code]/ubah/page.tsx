import type { Metadata } from "next";

import { TipeIbadahFormScreen } from "@/features/peribadahan/tipe-ibadah/form";

export const metadata: Metadata = {
  title: "Ubah Tipe Ibadah",
};

export default async function Page({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  return <TipeIbadahFormScreen code={code} />;
}
