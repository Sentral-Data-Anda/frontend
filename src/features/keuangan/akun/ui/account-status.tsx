import { Badge } from "@/components/common/display";

import { ACCOUNT_STATUS_LABEL } from "../types";

interface PropTypes {
  isActive: boolean;
}

export const AccountStatus = (props: PropTypes) => {
  const { isActive } = props;

  return (
    <Badge variant={isActive ? "success" : "neutral"}>
      {ACCOUNT_STATUS_LABEL[isActive ? "true" : "false"]}
    </Badge>
  );
};
