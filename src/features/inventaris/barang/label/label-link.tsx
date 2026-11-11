import { Printer } from "lucide-react";

import { buttonVariants } from "@/components/common/control";
import { AppLink } from "@/components/common/link";
import { cn } from "@/lib/utils";

interface PropTypes {
  href: string;
  isIconOnly?: boolean;
}

export const LabelLink = (props: PropTypes) => {
  const { href, isIconOnly = false } = props;

  return (
    <AppLink
      href={href}
      aria-label={isIconOnly ? "Cetak label" : undefined}
      title={isIconOnly ? "Cetak label" : undefined}
      className={cn(
        buttonVariants({
          variant: "outline",
          size: isIconOnly ? "icon" : "default",
        }),
        "shrink-0 cursor-pointer",
      )}
    >
      <Printer aria-hidden />
      {isIconOnly ? null : "Cetak label"}
    </AppLink>
  );
};
