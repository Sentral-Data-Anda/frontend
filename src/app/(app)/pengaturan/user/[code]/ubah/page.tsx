import type { Metadata } from "next";

import { UserFormScreen } from "@/features/pengaturan/user/form";

export const metadata: Metadata = {
  title: "Detail Akun",
};

export default async function Page({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  return <UserFormScreen code={code} />;
}
