import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import {
  roleUserTable,
  RoleUserListScreen,
} from "@/features/pengaturan/role-user/list";

function Page() {
  return (
    <PageContainer size="full">
      <Suspense
        fallback={
          <LoadingDataList shape="trailing" table={roleUserTable(false)} />
        }
      >
        <RoleUserListScreen />
      </Suspense>
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/settings/user-role/")({
  head: () => ({ meta: [{ title: withSiteName("User Role") }] }),
  component: Page,
});
