import type { ReactNode } from "react";

import { PANEL_TITLE } from "@/components/common/display";

interface PropTypes {
  title: string;
  children: ReactNode;
}

export const ProfileGroup = (props: PropTypes) => {
  const { title, children } = props;

  return (
    <div className="border-hairline border-t px-gutter pt-3 pb-1">
      <h2 className={PANEL_TITLE}>{title}</h2>
      <dl className="divide-hairline divide-y">{children}</dl>
    </div>
  );
};
