import { summarizeRules } from "../model";
import type { BapelRule } from "../types";

interface PropTypes {
  rules: BapelRule[];
}

export const RuleSummary = (props: PropTypes) => {
  const { rules } = props;

  const summary = summarizeRules(rules);

  return summary ? (
    <span className="block truncate tabular-nums" title={summary}>
      {summary}
    </span>
  ) : (
    <span className="text-muted-foreground">
      <span aria-hidden>—</span>
      <span className="sr-only">Tanpa aturan</span>
    </span>
  );
};
