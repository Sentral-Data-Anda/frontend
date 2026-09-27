import { Badge } from "@/components/common/display";

interface PropTypes {
  originDate: string;
}

export const RecurringBadge = (props: PropTypes) => {
  const { originDate } = props;

  return (
    <Badge variant="secondary">Berulang sejak {originDate.slice(0, 4)}</Badge>
  );
};
