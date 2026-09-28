import { Globe } from "lucide-react";

import { Badge } from "@/components/common/display";

export const WebsiteMark = () => (
  <Badge className="pointer-events-none absolute bottom-1.5 left-1.5">
    <Globe aria-hidden />
    Website
  </Badge>
);
