import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import {
  CycleListScreen,
  loadingTableOf,
} from "@/features/inventaris/siklus-aset/list";
import { useAppSearchParams } from "@/hooks/use-app-router";

const Page = () => {
  const jenis = useAppSearchParams().get("jenis") ?? undefined;

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
};

export const Route = createFileRoute("/_app/fixed-asset/asset-transaction/")({
  head: () => ({ meta: [{ title: withSiteName("Asset Transaction") }] }),
  component: Page,
});
