import type { Metadata } from "next";

import { IbadahFormScreen } from "@/features/peribadahan/ibadah/form";

export const metadata: Metadata = {
  title: "Ubah Ibadah",
};

export default async function Page({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;

  return <IbadahFormScreen code={publicId} />;
}
