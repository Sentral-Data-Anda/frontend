import { Badge } from "@/components/common/display";

interface PropTypes {
  endedAt: string | null;
}

export const MarriageStatus = (props: PropTypes) => {
  const { endedAt } = props;

  return endedAt ? (
    <Badge variant="neutral">Berakhir</Badge>
  ) : (
    <Badge variant="success">Aktif</Badge>
  );
};
