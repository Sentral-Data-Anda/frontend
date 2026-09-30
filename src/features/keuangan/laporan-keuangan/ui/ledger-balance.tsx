import { Panel } from "@/components/common/display";

import { money } from "../model";

interface PropTypes {
  label: string;
  amount: string | undefined;
}

export const LedgerBalance = (props: PropTypes) => {
  const { label, amount } = props;

  return (
    <Panel className="flex min-h-11 items-center justify-between gap-3 px-gutter py-2.5">
      <span className="text-muted-foreground min-w-0 truncate text-body">
        {label}
      </span>

      <span className="shrink-0 text-body font-semibold tabular-nums">
        {amount === undefined ? "—" : money(amount)}
      </span>
    </Panel>
  );
};
