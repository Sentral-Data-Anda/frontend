import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import {
  SettingListScreen,
  settingTable,
} from "@/features/keuangan/setelan-akuntansi/list";

export const metadata: Metadata = {
  title: "Setelan Akuntansi",
};

export default function Page() {
  return (
    <PageContainer size="full">
      <Suspense fallback={<LoadingDataList table={settingTable(false)} />}>
        <SettingListScreen />
      </Suspense>
    </PageContainer>
  );
}
