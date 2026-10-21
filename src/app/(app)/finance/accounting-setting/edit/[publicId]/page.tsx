import type { Metadata } from "next";

import { SettingFormScreen } from "@/features/keuangan/setelan-akuntansi/form";

export const metadata: Metadata = {
  title: "Ubah Accounting Setting",
};

export default async function Page({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;

  return <SettingFormScreen settingKey={publicId} />;
}
