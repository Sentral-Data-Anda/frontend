import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import {
  CycleListScreen,
  loadingTableOf,
} from "@/features/inventaris/siklus-aset/list";

export const metadata: Metadata = {
  title: "Siklus Aset",
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ jenis?: string }>;
}) {
  const { jenis } = await searchParams;

  return (
    <PageContainer size="full">
      <Suspense
        fallback={
          <LoadingDataList shape="trailing" table={loadingTableOf(jenis)} />
        }
      >
        <CycleListScreen />
      </Suspense>
    </PageContainer>
  );
}
