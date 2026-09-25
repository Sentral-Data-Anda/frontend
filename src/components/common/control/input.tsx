import type { ComponentProps, ReactNode } from "react";

import { Input as InputPrimitive } from "@/components/ui";
import { cn } from "@/lib/utils";

export function Input({
  icon,
  className,
  ...props
}: ComponentProps<typeof InputPrimitive> & { icon?: ReactNode }) {
  if (!icon) return <InputPrimitive className={className} {...props} />;

  return (
    <div className="relative">
      <span
        aria-hidden
        className="text-muted-foreground pointer-events-none absolute inset-y-0 left-2.5 flex items-center [&_svg]:size-3.5"
      >
        {icon}
      </span>
      <InputPrimitive className={cn("pl-8", className)} {...props} />
    </div>
  );
}
