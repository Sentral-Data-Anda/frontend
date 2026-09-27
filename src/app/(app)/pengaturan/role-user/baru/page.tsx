import type { Metadata } from "next";

import { RoleUserFormScreen } from "@/features/pengaturan/role-user/form";

export const metadata: Metadata = {
  title: "Tambah Role",
};

export default function Page() {
  return <RoleUserFormScreen />;
}
