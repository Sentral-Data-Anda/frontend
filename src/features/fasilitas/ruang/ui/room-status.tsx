import { Badge } from "@/components/common/display";

import { ROOM_STATUS_LABEL } from "../types";

interface PropTypes {
  isActive: boolean;
}

export const RoomStatus = (props: PropTypes) => {
  const { isActive } = props;

  return (
    <Badge variant={isActive ? "success" : "neutral"}>
      {ROOM_STATUS_LABEL[isActive ? "true" : "false"]}
    </Badge>
  );
};
