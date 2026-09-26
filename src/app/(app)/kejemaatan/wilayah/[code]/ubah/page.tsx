import type { Metadata } from "next";

import { WilayahFormScreen } from "@/features/kejemaatan/wilayah/form";

export const metadata: Metadata = {
  title: "Ubah Wilayah",
};

export default async function Page({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  return <WilayahFormScreen code={code} />;
}
