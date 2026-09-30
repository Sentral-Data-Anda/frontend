import { Badge } from "@/components/common/display";
import {
  PERSEMBAHAN_STATUS_LABEL,
  type PersembahanStatus,
} from "@/types/keuangan";

import { PERSEMBAHAN_STATUS_VARIANT } from "../model";

interface PropTypes {
  status: PersembahanStatus;
}

export const PersembahanStatusBadge = (props: PropTypes) => {
  const { status } = props;

  return (
    <Badge variant={PERSEMBAHAN_STATUS_VARIANT[status]}>
      {PERSEMBAHAN_STATUS_LABEL[status]}
    </Badge>
  );
};
