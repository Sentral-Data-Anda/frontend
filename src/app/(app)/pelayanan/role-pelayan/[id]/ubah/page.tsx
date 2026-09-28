import type { Metadata } from "next";

import { RolePelayanFormScreen } from "@/features/pelayanan/role-pelayan/form";

export const metadata: Metadata = {
  title: "Ubah Role Pelayan",
};

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <RolePelayanFormScreen id={id} />;
}
