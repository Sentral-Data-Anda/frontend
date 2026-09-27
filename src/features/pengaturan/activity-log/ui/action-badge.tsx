import { Badge } from "@/components/common/display";

import { ACTION_LABEL, isDeleteKind } from "../model";
import type { ActionKind } from "../types";

interface PropTypes {
  kind: ActionKind;
}

export const ActionBadge = (props: PropTypes) => {
  const { kind } = props;

  return (
    <Badge variant={isDeleteKind(kind) ? "destructive" : "secondary"}>
      {ACTION_LABEL[kind]}
    </Badge>
  );
};
