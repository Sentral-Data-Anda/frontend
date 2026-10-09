import type { Metadata } from "next";

import { RateFormScreen } from "@/features/keuangan/mata-uang/form";

export const metadata: Metadata = {
  title: "Ubah Kurs",
};

export default async function Page({
  params,
}: {
  params: Promise<{ code: string; id: string }>;
}) {
  const { code, id } = await params;

  return <RateFormScreen code={code} id={id} />;
}
