import type { Metadata } from "next";

import { RolePelayanFormScreen } from "@/features/pelayanan/role-pelayan/form";

export const metadata: Metadata = {
  title: "Tambah Role Pelayan",
};

export default function Page() {
  return <RolePelayanFormScreen />;
}
