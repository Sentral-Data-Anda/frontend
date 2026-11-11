import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import { userTable, UserListScreen } from "@/features/pengaturan/user/list";

function Page() {
  return (
    <PageContainer size="full">
      <Suspense fallback={<LoadingDataList table={userTable} />}>
        <UserListScreen />
      </Suspense>
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/settings/user/")({
  head: () => ({ meta: [{ title: withSiteName("User") }] }),
  component: Page,
});
