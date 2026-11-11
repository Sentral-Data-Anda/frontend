import { Pencil } from "lucide-react";

import { buttonVariants } from "@/components/common/control";
import { AppLink } from "@/components/common/link";
import { cn } from "@/lib/utils";

import { rateEditHref, rateLabelOf, saveRateFocus } from "../model";
import type { Rate } from "../types";

interface PropTypes {
  rate: Rate;
}

export const RateEditLink = (props: PropTypes) => {
  const { rate } = props;

  return (
    <AppLink
      href={rateEditHref(rate.currencyCode, rate.id)}
      onClick={() => saveRateFocus(rate)}
      aria-label={rateLabelOf(rate)}
      className={cn(
        buttonVariants({ variant: "ghost", size: "icon-sm" }),
        "cursor-pointer",
      )}
    >
      <Pencil aria-hidden />
    </AppLink>
  );
};
