import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import {
  SkillMusikListScreen,
  skillMusikTable,
} from "@/features/pelayanan/skill-musik/list";

export const metadata: Metadata = {
  title: "Skill Musik",
};

export default function Page() {
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
