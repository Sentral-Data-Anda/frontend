import type { Metadata } from "next";

import { WilayahFormScreen } from "@/features/kejemaatan/wilayah/form";

export const metadata: Metadata = {
  title: "Ubah Wilayah",
};

export default async function Page({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;

  return <WilayahFormScreen code={publicId} />;
}
