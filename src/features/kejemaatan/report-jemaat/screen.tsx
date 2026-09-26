"use client";

import { DashboardGrid } from "@/components/common/dashboard";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useListParams, type ListFilterSchema } from "@/hooks/use-list-params";

import {
  useAgeReport,
  useBloodTypeReport,
  useEthnicReport,
  useLastEducationReport,
  useProfessionReport,
} from "./api";
import { readMonth } from "./model";
import { BirthdayCard } from "./ui/birthday-card";
import { CompletenessCard } from "./ui/completeness-card";
import { ReportKpi } from "./ui/report-kpi";
import { ShareCard } from "./ui/share-card";

const REPORT_FILTERS = { bulan: { api: "bulan" } } satisfies ListFilterSchema;

export const ReportJemaatScreen = () => {
  const listParams = useListParams({ filters: REPORT_FILTERS });
  const month = readMonth(listParams.filters.bulan);
  const age = useAgeReport();
  const ethnic = useEthnicReport();
  const profession = useProfessionReport();
  const bloodType = useBloodTypeReport();
  const lastEducation = useLastEducationReport();

  return (
    <div className="pb-6">
      <PageHeader
        title="Laporan Jemaat"
        backHref={domainHref(MENU.KEJEMAATAN)}
      />

      <div className="flex flex-col gap-4 px-gutter">
        <DashboardGrid
          isStacked
          kpi={<ReportKpi />}
          main={[]}
          side={[
            <ShareCard
              key="age"
              title="Usia anggota"
              unit="anggota"
              emptyTitle="Belum ada anggota dengan tanggal lahir"
              query={age}
            />,
            <ShareCard
              key="ethnic"
              title="Suku"
              unit="jemaat"
              emptyTitle="Belum ada jemaat dengan suku tercatat"
              query={ethnic}
            />,
            <ShareCard
              key="profession"
              title="Pekerjaan"
              unit="jemaat"
              emptyTitle="Belum ada jemaat dengan pekerjaan tercatat"
              query={profession}
            />,
            <ShareCard
              key="blood-type"
              title="Golongan darah"
              unit="jemaat"
              emptyTitle="Belum ada jemaat dengan golongan darah tercatat"
              query={bloodType}
            />,
            <ShareCard
              key="last-education"
              title="Pendidikan terakhir"
              unit="jemaat"
              emptyTitle="Belum ada jemaat dengan pendidikan tercatat"
              query={lastEducation}
            />,
            <CompletenessCard key="completeness" />,
          ]}
        />

        <BirthdayCard
          month={month}
          onPickMonth={(value) => listParams.onPickFilter("bulan", value)}
        />
      </div>
    </div>
  );
};
