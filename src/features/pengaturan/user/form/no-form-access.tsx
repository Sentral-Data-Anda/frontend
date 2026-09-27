"use client";

import Link from "next/link";

import { buttonVariants } from "@/components/common/control";
import { PageHeader } from "@/components/layout";

import { USER_LIST_PATH } from "../model";

interface PropTypes {
  isEdit: boolean;
}

export const NoFormAccess = (props: PropTypes) => {
  const { isEdit } = props;

  return (
    <div className="mx-auto w-full max-w-lg">
      <PageHeader
        title={isEdit ? "Tidak bisa membuka akun" : "Tidak bisa menambah akun"}
        backHref={USER_LIST_PATH}
        isBackPersistent
      />

      <div className="flex flex-col items-start gap-3 px-gutter">
        <p className="text-muted-foreground text-body">
          {isEdit
            ? "Peran Anda tidak memegang izin melihat akun login."
            : "Peran Anda hanya bisa melihat akun login. Penambahan akun baru biasanya dikerjakan administrator."}
        </p>

        <p className="text-muted-foreground text-body">
          Hubungi administrator bila Anda memang seharusnya memegang akses ini.
        </p>

        <Link
          href={USER_LIST_PATH}
          className={buttonVariants({ variant: "outline" })}
        >
          Kembali ke User
        </Link>
      </div>
    </div>
  );
};
