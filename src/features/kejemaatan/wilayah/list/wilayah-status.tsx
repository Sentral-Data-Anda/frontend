import { Badge } from "@/components/common/display";

import { WILAYAH_STATUS_LABEL } from "../types";

interface PropTypes {
  isActive: boolean;
}

export const WilayahStatus = (props: PropTypes) => {
  const { isActive } = props;

  return (
    <Badge variant={isActive ? "success" : "neutral"}>
      {WILAYAH_STATUS_LABEL[isActive ? "true" : "false"]}
    </Badge>
  );
};
