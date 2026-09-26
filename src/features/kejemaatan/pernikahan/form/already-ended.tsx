"use client";

import Link from "next/link";

import { buttonVariants } from "@/components/common/control";
import { EmptyState } from "@/components/common/feedback";
import { PageHeader } from "@/components/layout";
import { formatDate } from "@/lib/format";

import { coupleName } from "../model";
import type { MarriageDetail } from "../types";

interface PropTypes {
  marriage: MarriageDetail & { endedAt: string };
  backHref: string;
}

export const AlreadyEnded = (props: PropTypes) => {
  const { marriage, backHref } = props;

  return (
    <div className="mx-auto w-full max-w-lg">
      <PageHeader
        title="Akhiri Pernikahan"
        subtitle={coupleName(marriage)}
        backHref={backHref}
        isBackPersistent
      />

      <EmptyState
        title="Pernikahan ini sudah berakhir"
        description={`Tercatat berakhir ${formatDate(marriage.endedAt)}. Tidak ada yang perlu diakhiri lagi.`}
        action={
          <Link
            href={backHref}
            className={buttonVariants({ variant: "outline" })}
          >
            Kembali ke Pernikahan
          </Link>
        }
      />
    </div>
  );
};
