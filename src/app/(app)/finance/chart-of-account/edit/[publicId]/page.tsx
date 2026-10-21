import type { Metadata } from "next";

import { AccountFormScreen } from "@/features/keuangan/akun/form";

export const metadata: Metadata = {
  title: "Ubah Chart of Account",
};

export default async function Page({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;

  return <AccountFormScreen code={publicId} />;
}
