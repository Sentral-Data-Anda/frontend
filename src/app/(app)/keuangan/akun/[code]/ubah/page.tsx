import type { Metadata } from "next";

import { AccountFormScreen } from "@/features/keuangan/akun/form";

export const metadata: Metadata = {
  title: "Ubah Akun",
};

export default async function Page({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  return <AccountFormScreen code={code} />;
}
