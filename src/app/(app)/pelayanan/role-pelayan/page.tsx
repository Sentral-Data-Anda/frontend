import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import {
  RolePelayanListScreen,
  rolePelayanTable,
} from "@/features/pelayanan/role-pelayan/list";

export const metadata: Metadata = {
  title: "Role Pelayan",
};

export default function Page() {
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
