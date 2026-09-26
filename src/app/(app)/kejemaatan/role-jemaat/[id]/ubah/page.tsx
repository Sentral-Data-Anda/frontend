import type { Metadata } from "next";

import { RoleJemaatFormScreen } from "@/features/kejemaatan/role-jemaat/form";

export const metadata: Metadata = {
  title: "Ubah Jabatan",
};

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <RoleJemaatFormScreen id={id} />;
}
