"use client";

import Link from "next/link";

import { DescriptionItem, DescriptionList } from "@/components/common/display";
import { FormSection, FormWide } from "@/components/common/form";
import { MENU, menuHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { formatDateTime } from "@/lib/format";

import { UserStatus } from "../list/user-status";
import type { UserDetail } from "../types";

const JEMAAT_LIST_PATH = menuHref(MENU.KEJEMAATAN, MENU.DAFTAR_JEMAAT);

interface PropTypes {
  user: UserDetail;
  note?: string;
}

export const AccountSection = (props: PropTypes) => {
  const { user, note } = props;

  const { isCanView: isCanViewJemaat } = useMenuAccess(MENU.DAFTAR_JEMAAT);

  return (
    <FormSection legend="Akun" note={note}>
      <FormWide>
        <DescriptionList>
          <DescriptionItem label="Jemaat">
            {isCanViewJemaat ? (
              <Link
                href={`${JEMAAT_LIST_PATH}?search=${encodeURIComponent(user.jemaat.code)}`}
                className="focus-visible:ring-ring text-primary rounded-control underline-offset-2 outline-none hover:underline focus-visible:ring-2"
              >
                {user.jemaat.name}
              </Link>
            ) : (
              user.jemaat.name
            )}
          </DescriptionItem>
          <DescriptionItem label="Username">{user.username}</DescriptionItem>
          <DescriptionItem label="Status">
            <UserStatus status={user.status} />
          </DescriptionItem>
          <DescriptionItem label="Terakhir masuk">
            {user.lastLogin ? formatDateTime(user.lastLogin) : "Belum pernah"}
          </DescriptionItem>
        </DescriptionList>
      </FormWide>
    </FormSection>
  );
};
