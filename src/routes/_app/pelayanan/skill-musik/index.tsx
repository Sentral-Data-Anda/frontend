import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import {
  SkillMusikListScreen,
  skillMusikTable,
} from "@/features/pelayanan/skill-musik/list";

function Page() {
  return (
    <PageContainer size="full">
      <Suspense
        fallback={
          <LoadingDataList shape="trailing" table={skillMusikTable(false)} />
        }
      >
        <SkillMusikListScreen />
      </Suspense>
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/pelayanan/skill-musik/")({
  head: () => ({ meta: [{ title: withSiteName("Skill Musik") }] }),
  component: Page,
});
