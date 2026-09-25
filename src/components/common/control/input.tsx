import type { ComponentProps, ReactNode } from "react";

import { Input as InputPrimitive } from "@/components/ui";
import { cn } from "@/lib/utils";

interface PropTypes extends ComponentProps<typeof InputPrimitive> {
  icon?: ReactNode;
}

export const Input = (props: PropTypes) => {
  const { icon, className, ...rest } = props;

  if (!icon) return <InputPrimitive className={className} {...rest} />;

  return (
    <div className="relative">
      <span
        aria-hidden
        className="text-muted-foreground pointer-events-none absolute inset-y-0 left-2.5 flex items-center [&_svg]:size-3.5"
      >
        {icon}
      </span>
      <InputPrimitive className={cn("pl-8", className)} {...rest} />
    </div>
  );
};
