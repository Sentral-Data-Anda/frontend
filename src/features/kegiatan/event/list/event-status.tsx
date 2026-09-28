import { Badge } from "@/components/common/display";

import { eventStatusOf } from "../model";
import {
  EVENT_STATUS_LABEL,
  type ChurchEvent,
  type EventStatus,
} from "../types";

const VARIANT = {
  DRAFT: "draft",
  DONE: "neutral",
  ONGOING: "success",
  UPCOMING: "wait",
} as const satisfies Record<EventStatus, string>;

interface PropTypes {
  event: Pick<ChurchEvent, "isPublish" | "startDate" | "endDate">;
}

export const EventStatusBadge = (props: PropTypes) => {
  const { event } = props;

  const status = eventStatusOf(event);

  return <Badge variant={VARIANT[status]}>{EVENT_STATUS_LABEL[status]}</Badge>;
};
