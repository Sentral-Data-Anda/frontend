"use client";

import Link from "next/link";

import { Avatar } from "@/components/common/display";
import { ACCOUNT_HREF } from "@/config/menu";
import { useSession } from "@/features/auth";

export const AccountLink = () => {
  const session = useSession();
  const name = session.jemaat?.name ?? session.username;

  return (
    <Link
      href={ACCOUNT_HREF}
      aria-label={`Akun saya: ${name}`}
      className="focus-visible:ring-ring relative shrink-0 rounded-full outline-none after:absolute after:-inset-1 focus-visible:ring-2 focus-visible:ring-offset-2"
    >
      <Avatar label={name} />
    </Link>
  );
};
