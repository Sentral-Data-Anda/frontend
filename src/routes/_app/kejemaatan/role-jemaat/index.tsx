import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import {
  roleJemaatTable,
  RoleJemaatListScreen,
} from "@/features/kejemaatan/role-jemaat/list";

function Page() {
  return (
    <PageContainer size="full">
      <Suspense fallback={<LoadingDataList table={roleJemaatTable(false)} />}>
        <RoleJemaatListScreen />
      </Suspense>
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/kejemaatan/role-jemaat/")({
  head: () => ({ meta: [{ title: withSiteName("Role Jemaat") }] }),
  component: Page,
});
