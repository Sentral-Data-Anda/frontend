import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import {
  SettingListScreen,
  settingTable,
} from "@/features/keuangan/setelan-akuntansi/list";

function Page() {
  return (
    <PageContainer size="full">
      <Suspense
        fallback={
          <LoadingDataList shape="trailing" table={settingTable(false)} />
        }
      >
        <SettingListScreen />
      </Suspense>
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/finance/accounting-setting/")({
  head: () => ({ meta: [{ title: withSiteName("Accounting Setting") }] }),
  component: Page,
});
