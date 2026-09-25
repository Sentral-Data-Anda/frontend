"use client";

import Link from "next/link";

import { buttonVariants } from "@/components/common/control";
import { FormSection, FormWide } from "@/components/common/form";
import { ACCOUNT_PASSWORD_HREF, MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";

export const SecuritySection = () => {
  const { isCanUpdate } = useMenuAccess(MENU.USER);

  return (
    <FormSection
      isReadOnly
      legend="Keamanan"
      note="Setelah password diganti, semua perangkat keluar dan Anda masuk lagi dengan password baru."
    >
      <FormWide className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-body font-medium">Password</p>
          <p className="text-muted-foreground text-body">
            {isCanUpdate
              ? "Gunakan satu huruf besar dan tiga angka."
              : "Akun ini belum boleh mengganti password sendiri. Hubungi administrator."}
          </p>
        </div>

        {isCanUpdate ? (
          <Link
            href={ACCOUNT_PASSWORD_HREF}
            className={buttonVariants({ variant: "outline" })}
          >
            Ubah password
          </Link>
        ) : null}
      </FormWide>
    </FormSection>
  );
};
