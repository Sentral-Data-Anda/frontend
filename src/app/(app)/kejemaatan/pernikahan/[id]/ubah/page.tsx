import type { Metadata } from "next";

import { MarriageFormScreen } from "@/features/kejemaatan/pernikahan/form";

export const metadata: Metadata = {
  title: "Ubah Pernikahan",
};

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <MarriageFormScreen id={id} />;
}
