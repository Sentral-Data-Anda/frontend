import type { Metadata } from "next";

import { UserFormScreen } from "@/features/pengaturan/user/form";

export const metadata: Metadata = {
  title: "Detail Akun",
};

export default async function Page({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;

  return <UserFormScreen code={publicId} />;
}
