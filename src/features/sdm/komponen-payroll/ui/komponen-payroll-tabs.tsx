import { ListTabs } from "@/components/common/list";
import { useAppRouter } from "@/hooks/use-app-router";

import { TABS } from "../model";

interface PropTypes {
  value: string;
}

export const KomponenPayrollTabs = (props: PropTypes) => {
  const { value } = props;

  const router = useAppRouter();

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
