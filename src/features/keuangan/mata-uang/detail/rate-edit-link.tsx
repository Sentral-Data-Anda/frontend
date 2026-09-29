import { Pencil } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/common/control";
import { cn } from "@/lib/utils";

import { rateEditHref, rateLabelOf, saveRateFocus } from "../model";
import type { Rate } from "../types";

interface PropTypes {
  rate: Rate;
}

export const RateEditLink = (props: PropTypes) => {
  const { rate } = props;

  return (
    <Link
      href={rateEditHref(rate.currencyCode, rate.id)}
      onClick={() => saveRateFocus(rate)}
      aria-label={rateLabelOf(rate)}
      className={cn(
        buttonVariants({ variant: "ghost", size: "icon-sm" }),
        "cursor-pointer",
      )}
    >
      <Pencil aria-hidden />
    </Link>
  );
};
