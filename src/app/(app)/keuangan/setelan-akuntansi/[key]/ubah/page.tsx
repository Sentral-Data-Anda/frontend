import type { Metadata } from "next";

import { SettingFormScreen } from "@/features/keuangan/setelan-akuntansi/form";

export const metadata: Metadata = {
  title: "Ubah Setelan Akuntansi",
};

export default async function Page({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;

  return <SettingFormScreen settingKey={key} />;
}
