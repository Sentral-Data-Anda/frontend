import type { Metadata } from "next";

import { MarriageFormScreen } from "@/features/kejemaatan/pernikahan/form";

export const metadata: Metadata = {
  title: "Ubah Pernikahan",
};

export default async function Page({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;

  return <MarriageFormScreen id={publicId} />;
}
