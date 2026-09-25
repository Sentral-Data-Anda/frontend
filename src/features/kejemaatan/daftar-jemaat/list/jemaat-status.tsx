import { Badge } from "@/components/common/display";

import { STATUS_JEMAAT_LABEL, type JemaatListItem } from "../types";

interface PropTypes {
  status: JemaatListItem["status"];
}

export const JemaatStatus = (props: PropTypes) => {
  const { status } = props;

  return (
    <Badge variant={status === "AKTIF" ? "success" : "neutral"}>
      {STATUS_JEMAAT_LABEL[status]}
    </Badge>
  );
};
