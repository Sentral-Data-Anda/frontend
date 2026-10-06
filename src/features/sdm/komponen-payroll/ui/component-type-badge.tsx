import { Badge } from "@/components/common/display";

import { COMPONENT_TYPE_LABEL, type ComponentType } from "../types";

interface PropTypes {
  type: ComponentType;
}

export const ComponentTypeBadge = (props: PropTypes) => {
  const { type } = props;

  return (
    <Badge variant={type === "EARNING" ? "secondary" : "destructive"}>
      {COMPONENT_TYPE_LABEL[type]}
    </Badge>
  );
};
