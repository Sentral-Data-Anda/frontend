import type { Metadata } from "next";

import { RateFormScreen } from "@/features/keuangan/mata-uang/form";

export const metadata: Metadata = {
  title: "Ubah Kurs",
};

export default async function Page({
  params,
}: {
  params: Promise<{ publicId: string; id: string }>;
}) {
  const { publicId, id } = await params;

  return <RateFormScreen code={publicId} id={id} />;
}
