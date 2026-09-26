import type { Metadata } from "next";

import { MarriageEndScreen } from "@/features/kejemaatan/pernikahan/form";

export const metadata: Metadata = {
  title: "Akhiri Pernikahan",
};

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <MarriageEndScreen id={id} />;
}
