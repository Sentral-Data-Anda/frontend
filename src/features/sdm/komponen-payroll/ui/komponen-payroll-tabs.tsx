"use client";

import { useRouter } from "next/navigation";

import { ListTabs } from "@/components/common/list";

import { TABS } from "../model";

interface PropTypes {
  value: string;
}

export const KomponenPayrollTabs = (props: PropTypes) => {
  const { value } = props;

  const router = useRouter();

  const onPickTab = (next: string) => {
    if (next !== value) router.push(next);
  };

  return (
    <ListTabs
      label="Komponen payroll"
      value={value}
      options={TABS}
      onValueChange={onPickTab}
    />
  );
};
