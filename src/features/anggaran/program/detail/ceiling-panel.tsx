"use client";

import Link from "next/link";

import { buttonVariants } from "@/components/common/control";
import { ProgressBar } from "@/components/common/dashboard";
import {
  DescriptionItem,
  DescriptionList,
  Panel,
} from "@/components/common/display";
import { FormAlert } from "@/components/common/form";
import { MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import type { CeilingUsage } from "@/types/anggaran";

import {
  BAR_ALERT_ABOVE,
  CEILING_MISSING_TITLE,
  CEILING_NOTE,
  amountText,
  ceilingBarMeta,
  ceilingBarTitle,
  ceilingExceededMessage,
  ceilingHref,
  ceilingMissingMessage,
  committedPercentOf,
  isCeilingExceeded,
  isCeilingMissing,
  remainingBeforeOf,
} from "../model";

interface PropTypes {
  ceiling: CeilingUsage;
  bapelId: number;
  yearLabel: string;
  proposedAmount: string;
}

export const CeilingPanel = (props: PropTypes) => {
  const { ceiling, bapelId, yearLabel, proposedAmount } = props;

  const { isCanView } = useMenuAccess(MENU.BUDGET);
  const isMissing = isCeilingMissing(ceiling);
  const isExceeded = isCeilingExceeded(ceiling);

  const ceilingLink = isCanView ? (
    <Link
      href={ceilingHref(bapelId, ceiling.year)}
      className={buttonVariants({ variant: "outline", size: "sm" })}
    >
      Lihat Pagu Anggaran
    </Link>
  ) : null;

  if (isMissing) {
    return (
      <section aria-label="Sisa pagu" className="space-y-2">
        <FormAlert
          tone="warning"
          title={CEILING_MISSING_TITLE}
          message={ceilingMissingMessage(yearLabel)}
        />
        {ceilingLink}
      </section>
    );
  }

  return (
    <Panel label="Sisa pagu">
      <div className="space-y-3 px-gutter py-4">
        <ProgressBar
          label="Dijanjikan ke program"
          title={ceilingBarTitle}
          value={committedPercentOf(ceiling)}
          meta={ceilingBarMeta(ceiling)}
          alertAbove={BAR_ALERT_ABOVE}
        />

        <p className="text-muted-foreground max-w-prose text-caption">
          {CEILING_NOTE}
        </p>

        {isExceeded ? (
          <div className="space-y-2">
            <FormAlert
              tone="warning"
              title="Usulan ini melebihi pagu"
              message={ceilingExceededMessage(
                remainingBeforeOf(ceiling, proposedAmount),
              )}
            />
            {ceilingLink}
          </div>
        ) : null}
      </div>

      <DescriptionList className="border-hairline border-t px-gutter py-2">
        <DescriptionItem label="Pagu">
          {amountText(ceiling.ceiling)}
        </DescriptionItem>
        <DescriptionItem label="Terpakai badan pelayanan ini">
          {amountText(ceiling.committed)}
        </DescriptionItem>
        <DescriptionItem label="Sisa setelah usulan ini">
          {amountText(ceiling.remaining)}
        </DescriptionItem>
      </DescriptionList>
    </Panel>
  );
};
