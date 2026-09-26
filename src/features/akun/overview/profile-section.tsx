"use client";

import { Avatar, Panel } from "@/components/common/display";
import { useSession } from "@/features/auth";

import { roleLabels } from "../model";

import { ProfileDetails } from "./profile-details";

export const ProfileSection = () => {
  const session = useSession();
  const jemaat = session.jemaat;
  const name = jemaat?.name ?? session.username;
  const roles = roleLabels(jemaat?.roleJemaat);

  return (
    <Panel label="Profil">
      <div className="flex items-center gap-3 px-gutter py-4">
        <Avatar label={name} />
        <div className="min-w-0">
          <p className="truncate text-title font-semibold">{name}</p>
          <p className="text-muted-foreground truncate text-body">
            {jemaat
              ? `${session.roleUser.name} · ${session.username}`
              : session.roleUser.name}
          </p>
        </div>
      </div>

      {jemaat ? (
        <ProfileDetails code={jemaat.code} roles={roles} />
      ) : (
        <p className="border-hairline text-muted-foreground border-t px-gutter py-3 text-body">
          Akun ini belum terhubung ke data jemaat.
        </p>
      )}
    </Panel>
  );
};
