"use client";

import Link from "next/link";

import { buttonVariants } from "@/components/common/control";
import { PageHeader } from "@/components/layout";

interface PropTypes {
  backHref: string;
  isCanUpdate: boolean;
}

export const NoFormAccess = (props: PropTypes) => {
  const { backHref, isCanUpdate } = props;

  return (
    <div className="mx-auto w-full max-w-lg">
      <PageHeader
        title="Tidak bisa menolak permintaan ini"
        backHref={backHref}
        isBackPersistent
      />

      <div className="flex flex-col items-start gap-3 px-gutter">
        <p className="text-muted-foreground text-body">
          {isCanUpdate
            ? "Permintaan ini tidak sedang menunggu tanda tangan Anda."
            : "Peran Anda hanya bisa melihat permintaan persetujuan."}
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
