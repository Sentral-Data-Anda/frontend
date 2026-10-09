import type { Metadata } from "next";

import { CurrencyFormScreen } from "@/features/keuangan/mata-uang/form";

export const metadata: Metadata = {
  title: "Ubah Mata Uang",
};

export default async function Page({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  return <CurrencyFormScreen code={code} />;
}
