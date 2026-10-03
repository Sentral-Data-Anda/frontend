import { Badge } from "@/components/common/display";

interface PropTypes {
  isBooked: boolean | null;
}

export const BookedBadge = (props: PropTypes) => {
  const { isBooked } = props;

  if (isBooked === null) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <Badge variant={isBooked ? "success" : "draft"}>
      {isBooked ? "Sudah" : "Belum"}
    </Badge>
  );
};
