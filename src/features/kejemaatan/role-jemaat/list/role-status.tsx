import { Badge } from "@/components/common/display";

import { ROLE_STATUS_LABEL } from "../types";

interface PropTypes {
  status: boolean;
}

export const RoleStatus = (props: PropTypes) => {
  const { status } = props;

  return (
    <Badge variant={status ? "success" : "neutral"}>
      {ROLE_STATUS_LABEL[status ? "true" : "false"]}
    </Badge>
  );
};
