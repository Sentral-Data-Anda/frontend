import { Badge } from "@/components/common/display";

import { PUBLISH_LABEL } from "../types";

interface PropTypes {
  isPublish: boolean;
}

export const AlbumStatus = (props: PropTypes) => {
  const { isPublish } = props;

  return (
    <Badge variant={isPublish ? "success" : "draft"}>
      {PUBLISH_LABEL[isPublish ? "true" : "false"]}
    </Badge>
  );
};
