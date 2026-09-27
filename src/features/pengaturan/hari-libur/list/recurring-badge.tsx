import { Badge } from "@/components/common/display";

interface PropTypes {
  since: number;
}

export const RecurringBadge = (props: PropTypes) => {
  const { since } = props;

  return <Badge variant="secondary">Berulang sejak {since}</Badge>;
};
