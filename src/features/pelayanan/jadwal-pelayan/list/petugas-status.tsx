import { Badge } from "@/components/common/display";

interface PropTypes {
  emptyCount: number;
  isShort?: boolean;
}

export const PetugasStatus = (props: PropTypes) => {
  const { emptyCount, isShort = false } = props;

  if (!emptyCount) return <Badge variant="success">Lengkap</Badge>;

  return (
    <Badge variant="draft" className="tabular-nums">
      {emptyCount} {isShort ? "belum diisi" : "slot belum diisi"}
    </Badge>
  );
};
