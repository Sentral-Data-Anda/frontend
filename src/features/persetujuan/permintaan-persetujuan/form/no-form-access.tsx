"use client";

import Link from "next/link";

import { buttonVariants } from "@/components/common/control";
import { PageHeader } from "@/components/layout";

interface PropTypes {
  backHref: string;
}

export const NoFormAccess = (props: PropTypes) => {
  const { backHref } = props;

  return (
    <div className="mx-auto w-full max-w-lg">
      <PageHeader
        title="Tidak bisa menolak permintaan ini"
        backHref={backHref}
        isBackPersistent
      />

      <div className="flex flex-col items-start gap-3 px-gutter">
        <p className="text-muted-foreground text-body">
          Permintaan ini tidak sedang menunggu tanda tangan Anda.
        </p>

        <Link
          href={backHref}
          className={buttonVariants({ variant: "outline" })}
        >
          Kembali ke permintaan
        </Link>
      </div>
    </div>
  );
};
