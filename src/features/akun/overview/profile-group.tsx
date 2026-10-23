import type { ReactNode } from "react";

import { DescriptionList, PANEL_TITLE } from "@/components/common/display";

interface PropTypes {
  title: string;
  /** Tautan di kanan judul, sebaris dengannya. */
  action?: ReactNode;
  children: ReactNode;
}

export const ProfileGroup = (props: PropTypes) => {
  const { title, action, children } = props;

  return (
    <div className="border-hairline border-t px-gutter pt-3 pb-1">
      <div className="flex items-center justify-between gap-3">
        <h2 className={PANEL_TITLE}>{title}</h2>
        {action}
      </div>
      <DescriptionList>{children}</DescriptionList>
    </div>
  );
};
