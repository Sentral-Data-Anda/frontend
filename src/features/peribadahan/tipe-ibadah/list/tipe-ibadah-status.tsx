import { Badge } from "@/components/common/display";

import { TIPE_IBADAH_STATUS_LABEL } from "../types";

interface PropTypes {
  isActive: boolean;
}

export const TipeIbadahStatus = (props: PropTypes) => {
  const { isActive } = props;

  return (
    <Badge variant={isActive ? "success" : "neutral"}>
      {TIPE_IBADAH_STATUS_LABEL[isActive ? "true" : "false"]}
    </Badge>
  );
};
