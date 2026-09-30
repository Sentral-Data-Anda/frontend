import { Landmark } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/common/control";
import { cn } from "@/lib/utils";

import { KAS_MASUK_GATEWAY_PATH } from "../model";

const LABEL = "Catat pencairan payment gateway";

export const GatewayShortcut = () => (
  <Link
    href={KAS_MASUK_GATEWAY_PATH}
    aria-label={LABEL}
    title={LABEL}
    className={cn(
      buttonVariants({ variant: "outline", size: "icon" }),
      "cursor-pointer rounded-full",
    )}
  >
    <Landmark aria-hidden />
  </Link>
);
