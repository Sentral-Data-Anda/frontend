"use client";

import Link from "next/link";

import { buttonVariants } from "@/components/common/control";
import { PageHeader } from "@/components/layout";

import { BAPEL_LIST_PATH } from "../model";

interface PropTypes {
  isEdit: boolean;
}

export const NoFormAccess = (props: PropTypes) => {
  const { isEdit } = props;

  return (
    <div className="mx-auto w-full max-w-lg">
      <PageHeader
        title={
          isEdit
            ? "Tidak bisa mengubah badan pelayanan"
            : "Tidak bisa menambah badan pelayanan"
        }
        backHref={BAPEL_LIST_PATH}
        isBackPersistent
      />

      <div className="flex flex-col items-start gap-3 px-gutter">
        <p className="text-muted-foreground text-body">
          Peran Anda hanya bisa melihat data badan pelayanan.
        </p>

        <p className="text-muted-foreground text-body">
          Hubungi administrator bila Anda memang seharusnya memegang akses ini.
        </p>

        <Link
          href={BAPEL_LIST_PATH}
          className={buttonVariants({ variant: "outline" })}
        >
          Kembali ke Badan Pelayanan
        </Link>
      </div>
    </div>
  );
};
