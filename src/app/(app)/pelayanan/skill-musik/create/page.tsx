import type { Metadata } from "next";

import { SkillMusikFormScreen } from "@/features/pelayanan/skill-musik/form";

export const metadata: Metadata = {
  title: "Tambah Alat Musik",
};

export default function Page() {
  return <SkillMusikFormScreen />;
}
