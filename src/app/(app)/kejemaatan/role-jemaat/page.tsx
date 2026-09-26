import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import {
  roleJemaatTable,
  RoleJemaatListScreen,
} from "@/features/kejemaatan/role-jemaat/list";

export const metadata: Metadata = {
  title: "Role Jemaat",
};

export default function Page() {
  return (
    <PageContainer size="full">
      <Suspense fallback={<LoadingDataList table={roleJemaatTable(false)} />}>
        <RoleJemaatListScreen />
      </Suspense>
    </PageContainer>
  );
}
