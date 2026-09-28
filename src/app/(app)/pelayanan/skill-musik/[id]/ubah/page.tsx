import type { Metadata } from "next";

import { SkillMusikFormScreen } from "@/features/pelayanan/skill-musik/form";

export const metadata: Metadata = {
  title: "Ubah Alat Musik",
};

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <SkillMusikFormScreen id={id} />;
}
