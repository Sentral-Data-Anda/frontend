import type { Metadata } from "next";

import { RoleUserFormScreen } from "@/features/pengaturan/role-user/form";

export const metadata: Metadata = {
  title: "Ubah Role",
};

export default async function Page({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;

  return <RoleUserFormScreen id={publicId} />;
}
