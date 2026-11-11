import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import {
  RolePelayanListScreen,
  rolePelayanTable,
} from "@/features/pelayanan/role-pelayan/list";

function Page() {
  return (
    <PageContainer size="full">
      <Suspense
        fallback={
          <LoadingDataList shape="trailing" table={rolePelayanTable(false)} />
        }
      >
        <RolePelayanListScreen />
      </Suspense>
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/pelayanan/role-pelayan/")({
  head: () => ({ meta: [{ title: withSiteName("Role Pelayan") }] }),
  component: Page,
});
