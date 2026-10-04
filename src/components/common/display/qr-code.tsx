import { useMemo } from "react";
import { renderSVG } from "uqr";

import { cn } from "@/lib/utils";

interface PropTypes {
  value: string;
  className?: string;
}

export const QrCode = (props: PropTypes) => {
  const { value, className } = props;

  const svg = useMemo(() => renderSVG(value, { ecc: "M", border: 1 }), [value]);

  return (
    <span
      aria-hidden
      className={cn("block [&>svg]:size-full", className)}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};
