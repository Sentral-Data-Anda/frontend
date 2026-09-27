import type { Metadata } from "next";

import { RoleUserFormScreen } from "@/features/pengaturan/role-user/form";

export const metadata: Metadata = {
  title: "Ubah Role",
};

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <RoleUserFormScreen id={id} />;
}
