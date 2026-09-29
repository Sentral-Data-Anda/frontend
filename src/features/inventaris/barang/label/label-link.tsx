import { Printer } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/common/control";
import { cn } from "@/lib/utils";

interface PropTypes {
  href: string;
  isIconOnly?: boolean;
}

export const LabelLink = (props: PropTypes) => {
  const { href, isIconOnly = false } = props;

  return (
    <Link
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
    </Link>
  );
};
