import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import { userTable, UserListScreen } from "@/features/pengaturan/user/list";

export const metadata: Metadata = {
  title: "User",
};

export default function Page() {
  return (
    <PageContainer size="full">
      <Suspense fallback={<LoadingDataList table={userTable} />}>
        <UserListScreen />
      </Suspense>
    </PageContainer>
  );
}
