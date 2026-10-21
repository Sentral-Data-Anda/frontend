import type { Metadata } from "next";

import { CurrencyFormScreen } from "@/features/keuangan/mata-uang/form";

export const metadata: Metadata = {
  title: "Ubah Currency",
};

export default async function Page({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;

  return <CurrencyFormScreen code={publicId} />;
}
