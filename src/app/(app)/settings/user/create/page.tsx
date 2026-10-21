import type { Metadata } from "next";

import { UserFormScreen } from "@/features/pengaturan/user/form";

export const metadata: Metadata = {
  title: "Tambah Akun",
};

export default function Page() {
  return <UserFormScreen />;
}
