import { Badge } from "@/components/common/display";

import { COMPONENT_STATUS_LABEL } from "../types";

interface PropTypes {
  isActive: boolean;
}

export const ComponentStatus = (props: PropTypes) => {
  const { isActive } = props;

  return (
    <Badge variant={isActive ? "success" : "neutral"}>
      {COMPONENT_STATUS_LABEL[isActive ? "true" : "false"]}
    </Badge>
  );
};
