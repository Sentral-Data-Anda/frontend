import type { Metadata } from "next";

import { RoleJemaatFormScreen } from "@/features/kejemaatan/role-jemaat/form";

export const metadata: Metadata = {
  title: "Tambah Jabatan",
};

export default function Page() {
  return <RoleJemaatFormScreen />;
}
