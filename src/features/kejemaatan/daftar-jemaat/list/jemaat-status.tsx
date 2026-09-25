import { Badge } from "@/components/common/display";

import { STATUS_JEMAAT_LABEL, type JemaatListItem } from "../types";

export function JemaatStatus({ status }: { status: JemaatListItem["status"] }) {
  return (
    <Badge variant={status === "AKTIF" ? "success" : "neutral"}>
      {STATUS_JEMAAT_LABEL[status]}
    </Badge>
  );
}
