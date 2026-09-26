"use client";

import { DashboardGrid } from "@/components/common/dashboard";

import {
  useAgeReport,
  useBloodTypeReport,
  useEthnicReport,
  useLastEducationReport,
  useProfessionReport,
} from "../api";

import { BirthdayCard } from "./birthday-card";
import { CompletenessCard } from "./completeness-card";
import { ReportKpi } from "./report-kpi";
import { ShareCard } from "./share-card";

interface PropTypes {
  month: number;
  onPickMonth: (month: string) => void;
}

export const ReportBody = (props: PropTypes) => {
  const { month, onPickMonth } = props;

  const age = useAgeReport();
  const bloodType = useBloodTypeReport();
  const lastEducation = useLastEducationReport();
  const ethnic = useEthnicReport();
  const profession = useProfessionReport();

  return (
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
            key="blood-type"
            title="Golongan darah"
            unit="jemaat"
            emptyTitle="Belum ada jemaat dengan golongan darah tercatat"
            query={bloodType}
          />,
          <CompletenessCard key="completeness" />,
          <ShareCard
            key="last-education"
            title="Pendidikan terakhir"
            unit="jemaat"
            emptyTitle="Belum ada jemaat dengan pendidikan tercatat"
            query={lastEducation}
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
        ]}
      />

      <BirthdayCard month={month} onPickMonth={onPickMonth} />
    </div>
  );
};
