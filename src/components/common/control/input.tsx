import type { ComponentProps, ReactNode } from "react";

import { Input as InputPrimitive } from "@/components/ui";
import { cn } from "@/lib/utils";

interface PropTypes extends ComponentProps<typeof InputPrimitive> {
  icon?: ReactNode;
  suffix?: string;
}

export const Input = (props: PropTypes) => {
  const { icon, suffix, className, style, ...rest } = props;

  if (!icon && !suffix)
    return <InputPrimitive className={className} style={style} {...rest} />;

  return (
    <div className="relative">
      {icon ? (
        <span
          aria-hidden
          className="text-muted-foreground pointer-events-none absolute inset-y-0 left-2.5 flex items-center [&_svg]:size-3.5"
        >
          {icon}
        </span>
      ) : null}
      <InputPrimitive
        className={cn(icon && "pl-8", className)}
        style={
          suffix
            ? { paddingRight: `calc(${suffix.length}ch + 1.25rem)`, ...style }
            : style
        }
        {...rest}
      />
      {suffix ? (
        <span
          aria-hidden
          className="text-muted-foreground pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-body"
        >
          {suffix}
        </span>
      ) : null}
    </div>
  );
};
