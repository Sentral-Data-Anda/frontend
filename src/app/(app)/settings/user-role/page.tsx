import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import {
  roleUserTable,
  RoleUserListScreen,
} from "@/features/pengaturan/role-user/list";

export const metadata: Metadata = {
  title: "Role User",
};

export default function Page() {
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
