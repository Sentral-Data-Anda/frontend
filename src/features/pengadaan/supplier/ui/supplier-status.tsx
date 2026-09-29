import { Badge } from "@/components/common/display";

import { SUPPLIER_STATUS_LABEL } from "../types";

interface PropTypes {
  isActive: boolean;
}

export const SupplierStatus = (props: PropTypes) => {
  const { isActive } = props;

  return (
    <Badge variant={isActive ? "success" : "neutral"}>
      {SUPPLIER_STATUS_LABEL[isActive ? "true" : "false"]}
    </Badge>
  );
};
