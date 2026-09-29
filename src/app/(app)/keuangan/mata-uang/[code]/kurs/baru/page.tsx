import type { Metadata } from "next";

import { RateFormScreen } from "@/features/keuangan/mata-uang/form";

export const metadata: Metadata = {
  title: "Tambah Kurs",
};

export default async function Page({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  return <RateFormScreen code={code} />;
}
